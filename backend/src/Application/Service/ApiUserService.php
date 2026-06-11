<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Domain\User;

/**
 * Coordinates API user application behavior.
 */
final class ApiUserService
{
    /**
     * Creates a new ApiUserService instance.
     */
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly ClassroomRepositoryInterface $classes,
        private readonly AcademyEmailPolicy $academyEmailPolicy,
        private readonly AuthTokenService $authTokens,
    ) {}

    /**
     * Registers the requested user account.
     */
    public function registerTeacher(
        string $firstName,
        string $lastName,
        string $email,
        string $password,
    ): User {
        $this->validateName($firstName, 'firstName');
        $this->validateName($lastName, 'lastName');
        $this->validateEmail($email);
        $this->validatePassword($password);

        if (null !== $this->users->findByLogin($email)) {
            throw new ApiException(409, 'CONFLICT', 'Email already exists.');
        }

        if (!$this->academyEmailPolicy->isAllowedTeacherEmail($email)) {
            throw new ApiException(
                422,
                'INVALID_TEACHER_EMAIL_DOMAIN',
                'Teacher registration requires an academic email domain.',
            );
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $username = $this->generateUniqueUsername($firstName, $lastName);

        $user = $this->users->insert(new RegistrationDetails(
            $firstName,
            $lastName,
            $username,
            $hashedPassword,
            'teacher',
            $email,
            null,
        ));
        $this->authTokens->issueEmailVerification($user->getId(), $email, $firstName);

        return $user;
    }

    /**
     * Registers the requested user account.
     */
    public function registerAccount(
        string $firstName,
        string $lastName,
        string $email,
        string $password,
    ): User {
        $this->validateName($firstName, 'firstName');
        $this->validateName($lastName, 'lastName');
        $this->validateEmail($email);
        $this->validatePassword($password);

        if (null !== $this->users->findByLogin($email)) {
            throw new ApiException(409, 'CONFLICT', 'Email already exists.');
        }

        $role = $this->academyEmailPolicy->isAllowedTeacherEmail($email) ? 'teacher' : 'free_user';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $username = $this->generateUniqueUsername($firstName, $lastName);

        $user = $this->users->insert(new RegistrationDetails(
            $firstName,
            $lastName,
            $username,
            $hashedPassword,
            $role,
            $email,
            null,
        ));
        $this->authTokens->issueEmailVerification($user->getId(), $email, $firstName);

        return $user;
    }

    /**
     * Registers the requested user account.
     */
    public function registerStudent(
        string $firstName,
        string $lastName,
        string $password,
        ?string $classCode = null,
    ): User {
        $this->validateName($firstName, 'firstName');
        $this->validateName($lastName, 'lastName');
        $this->validatePassword($password);

        $classCode = null !== $classCode ? trim($classCode) : '';
        if ('' === $classCode) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Class code is required.');
        }

        $class = $this->classes->findByCode($classCode);
        if (null === $class) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid class code.');
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $username = $this->generateUniqueUsername($firstName, $lastName);

        return $this->createStudentForClass($firstName, $lastName, $hashedPassword, $class->getId());
    }

    /**
     * Creates the requested resource.
     */
    public function createStudentForClass(
        string $firstName,
        string $lastName,
        string $hashedPassword,
        int $classId,
    ): User {
        $this->validateName($firstName, 'firstName');
        $this->validateName($lastName, 'lastName');
        $username = $this->generateUniqueUsername($firstName, $lastName);

        return $this->users->insert(new RegistrationDetails(
            $firstName,
            $lastName,
            $username,
            $hashedPassword,
            'student',
            null,
            $classId,
        ));
    }

    /**
     * Verifies the requested value.
     */
    public function verifyEmail(string $token): void
    {
        $userId = $this->authTokens->resolveUserId($token, 'email_verification');
        if (null === $userId) {
            throw new ApiException(422, 'INVALID_TOKEN', 'Invalid or expired verification token.');
        }

        $this->users->markEmailVerified($userId);
        $this->authTokens->consumeToken($token);
    }

    /**
     * Processes the requested action.
     */
    public function requestPasswordReset(string $email): void
    {
        $this->validateEmail($email);
        $user = $this->users->findByLogin(trim($email));
        if (null === $user || null === $user->getEmail()) {
            return;
        }

        $this->authTokens->issuePasswordReset(
            $user->getId(),
            $user->getEmail(),
            $user->getFirstname(),
        );
    }

    /**
     * Resets the requested state.
     */
    public function resetPasswordWithToken(string $token, string $password): void
    {
        $this->validatePassword($password);
        $userId = $this->authTokens->resolveUserId($token, 'password_reset');
        if (null === $userId) {
            throw new ApiException(422, 'INVALID_TOKEN', 'Invalid or expired reset token.');
        }

        $this->users->resetPassword($userId, password_hash($password, PASSWORD_DEFAULT));
        $this->authTokens->consumeToken($token);
    }

    /**
     * Validate name.
     */
    private function validateName(string $value, string $field): void
    {
        $value = trim($value);
        if ('' === $value || mb_strlen($value) > 120) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid '.$field.'.');
        }
    }

    /**
     * Validate username.
     */
    private function validateUsername(string $username): void
    {
        $username = trim($username);
        if (1 !== preg_match('/^[a-zA-Z0-9_.-]{3,80}$/', $username)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid username.');
        }
    }

    /**
     * Validate email.
     */
    private function validateEmail(string $email): void
    {
        if (false === filter_var(trim($email), FILTER_VALIDATE_EMAIL)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid email.');
        }
    }

    /**
     * Validate password.
     */
    private function validatePassword(string $password): void
    {
        if (mb_strlen($password) < 8) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Password must be at least 8 characters.');
        }
    }

    /**
     * Generate unique username.
     */
    private function generateUniqueUsername(string $firstName, string $lastName): string
    {
        $base = $this->buildUsernameBase($firstName, $lastName);

        for ($index = 1; $index <= 9999; ++$index) {
            $suffix = (string) $index;
            $maxBaseLength = 80 - mb_strlen($suffix);
            $candidate = mb_substr($base, 0, $maxBaseLength).$suffix;
            $this->validateUsername($candidate);

            if (null === $this->users->findByUsername($candidate)) {
                return $candidate;
            }
        }

        throw new ApiException(409, 'CONFLICT', 'No available username could be generated.');
    }

    /**
     * Build username base.
     */
    private function buildUsernameBase(string $firstName, string $lastName): string
    {
        $firstPart = $this->normalizeUsernamePart($firstName);
        $lastPart = $this->normalizeUsernamePart($lastName);

        if ('' !== $firstPart && '' !== $lastPart) {
            return $firstPart.'.'.$lastPart;
        }

        $base = '' !== $firstPart ? $firstPart : $lastPart;

        return mb_strlen($base) >= 2 ? $base : 'user';
    }

    /**
     * Normalize username part.
     */
    private function normalizeUsernamePart(string $value): string
    {
        $value = strtolower(trim(strtr($value, [
            'À' => 'A',
            'Á' => 'A',
            'Â' => 'A',
            'Ã' => 'A',
            'Ä' => 'A',
            'Å' => 'A',
            'Æ' => 'AE',
            'Ç' => 'C',
            'È' => 'E',
            'É' => 'E',
            'Ê' => 'E',
            'Ë' => 'E',
            'Ì' => 'I',
            'Í' => 'I',
            'Î' => 'I',
            'Ï' => 'I',
            'Ñ' => 'N',
            'Ò' => 'O',
            'Ó' => 'O',
            'Ô' => 'O',
            'Õ' => 'O',
            'Ö' => 'O',
            'Ù' => 'U',
            'Ú' => 'U',
            'Û' => 'U',
            'Ü' => 'U',
            'Ý' => 'Y',
            'Œ' => 'OE',
            'à' => 'a',
            'á' => 'a',
            'â' => 'a',
            'ã' => 'a',
            'ä' => 'a',
            'å' => 'a',
            'æ' => 'ae',
            'ç' => 'c',
            'è' => 'e',
            'é' => 'e',
            'ê' => 'e',
            'ë' => 'e',
            'ì' => 'i',
            'í' => 'i',
            'î' => 'i',
            'ï' => 'i',
            'ñ' => 'n',
            'ò' => 'o',
            'ó' => 'o',
            'ô' => 'o',
            'õ' => 'o',
            'ö' => 'o',
            'ù' => 'u',
            'ú' => 'u',
            'û' => 'u',
            'ü' => 'u',
            'ý' => 'y',
            'ÿ' => 'y',
            'œ' => 'oe',
        ])));

        return preg_replace('/[^a-z0-9]+/', '', $value) ?? '';
    }
}
