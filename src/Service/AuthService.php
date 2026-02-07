<?php
declare(strict_types=1);

namespace Src\Service;

use Core\Interfaces\AuthSessionInterface;
use Core\Interfaces\CookieInterface;
use Core\Interfaces\CryptoInterface;
use Src\Domain\User;
use Src\DTO\LoginData;
use Src\DTO\RegisterData;
use Src\Exception\AuthException;
use Src\Repository\ClassRepository;
use Src\Repository\TeacherCodeRepository;
use Src\Repository\UserRepository;

class AuthService
{
    private UserRepository $userRepository;
    private ClassRepository $classRepository;
    private TeacherCodeRepository $teacherCodeRepository;

    private CryptoInterface $crypto;
    private AuthSessionInterface $auth;
    private CookieInterface $cookie;

    public function __construct(
        UserRepository        $userRepository,
        ClassRepository       $classRepository,
        TeacherCodeRepository $teacherCodeRepository,
        CryptoInterface       $crypto,
        AuthSessionInterface  $auth,
        CookieInterface       $cookie
    ) {
        $this->userRepository = $userRepository;
        $this->classRepository = $classRepository;
        $this->teacherCodeRepository = $teacherCodeRepository;

        $this->crypto = $crypto;
        $this->auth = $auth;
        $this->cookie = $cookie;
    }

    /**
     * Attempts to authenticate a user.
     * Handles password verification, session creation, and the "Remember Me" feature.
     *
     * @param LoginData $loginData
     *
     * @return bool True if authentication succeeds, false otherwise
     */
    public function attemptLogin(LoginData $loginData): bool
    {
        // Retrieve the user by login (email or username)
        $user = $this->userRepository->findByLogin($loginData->login);

        if (!$user) {
            return false; // Unknown user
        }

        // Verify the provided password against the stored hash
        if (!$this->crypto->verifyPassword($loginData->password, $user->getPassword())) {
            return false; // Invalid credentials
        }

        // Create the user session
        $this->auth->login($user->getId());

        // Enable the "Remember Me" mechanism if requested
        if ($loginData->remember) {
            $this->rememberUser($user->getId());
        }

        return true;
    }

    /**
     * Registers a standard user.
     *
     * @throws AuthException
     */
    public function registerStandardUser(RegisterData $data): User {
        // Set the role to 'standard'
        $data->role = 'standard';
        // Create the user
        return $this->persistUser($data);
    }

    /**
     * Registers a teacher using a teacher invitation code.
     *
     * @throws AuthException
     */
    public function registerTeacher(RegisterData $data): User
    {
        // Validate the teacher code
        $code = $this->teacherCodeRepository->findByCode($data->teacherCode);

        if (!$code) {
            throw new AuthException("Code enseignant invalide.");
        }
        if ($code->isUsed()) {
            throw new AuthException("Ce code enseignant a déjà été utilisé.");
        }

        $data->role = 'teacher';

        // Create the teacher user
        $user = $this->persistUser($data);

        // Mark the teacher code as used and link it to the user
        $this->teacherCodeRepository->markAsUsed($code->getId(), $user->getId());

        return $user;
    }

    /**
     * Registers a student using a class code.
     *
     * @throws AuthException If the class code is invalid
     */
    public function registerStudent(RegisterData $data): User
    {
        // Validate the class code
        $class = $this->classRepository->findByCode($data->classCode);
        if (!$class) {
            throw new AuthException("Code classe introuvable.");
        }

        $data->role = 'student';
        $data->classId = $class->getId();
        $data->email = null;

        // Create the student user and associate them with the class
        return $this->persistUser($data);
    }

    /**
     * Handles the core user persistence logic.
     * Performs uniqueness checks and password hashing before saving.
     *
     * @throws AuthException
     */
    private function persistUser(RegisterData $data): User
    {
        // Ensure the username (pseudo) is unique
        if ($this->userRepository->findByLogin($data->pseudo)) {
            throw new AuthException("Le pseudo '{$data->pseudo}' est déjà utilisé.");
        }

        // Ensure the email is unique (if provided)
        if (!empty($data->email)) {
            // TODO: findByLogin currently checks both username and email.
            // A dedicated findByEmail() method would be more explicit.
            if ($this->userRepository->findByLogin($data->email)) {
                throw new AuthException("L'email '{$data->email}' est déjà associé à un compte.");
            }
        }

        // Hash the password before persistence
        if (isset($data->password)) {
            $data->password = $this->crypto->hashPassword($data->password);
        }

        // Persist the user and return the generated user
        return $this->userRepository->create($data);
    }

    /**
     * Enables the "Remember Me" authentication mechanism.
     */
    public function rememberUser(int $userId): void
    {
        // Generate a secure random token
        $token = bin2hex(random_bytes(32));

        // Store the hashed token in the database
        $tokenHash = $this->crypto->hashToken($token);
        $this->userRepository->setRememberToken($userId, $tokenHash);

        // Store the plain token in the cookie
        // Format : "USER_ID:TOKEN_CLAIR"
        $cookieValue = base64_encode($userId . ':' . $token);
        $this->cookie->set('REMEMBER_ME', $cookieValue, 43200); // 43200 minutes = 30 days
    }

    /**
     * Attempts to automatically authenticate a user using the "Remember Me" cookie.
     */
    public function tryAutoLogin(): bool
    {
        // If no cookie is present, fail
        if (!$this->cookie->has('REMEMBER_ME')) {
            return false;
        }

        // Decode cookie
        $cookieValue = $this->cookie->get('REMEMBER_ME');
        $data = explode(':', base64_decode($cookieValue));
        if (count($data) !== 2) {
            return false;
        }

        [$userId, $plainToken] = $data;
        $userId = (int)$userId;

        // Look up the user in the database
        $tokenHash = $this->crypto->hashToken($plainToken);
        $user = $this->userRepository->findByIdAndToken($userId, $tokenHash);

        if ($user) {
            // Success, recreate the session
            $this->auth->login($user->getId());
            return true;
        }

        return false;
    }

    /**
     * Performs a full logout.
     * Clears session data, authentication cookies, and persistent tokens.
     */
    public function logout(): void
    {
        // Remove the token from the database
        $userId = $this->auth->id();
        if ($userId) {
            $this->userRepository->setRememberToken($userId, null);
        }

        // Destroy the cookie
        $this->cookie->remove('REMEMBER_ME');

        // Destroy the session
        $this->auth->logout();
    }
}