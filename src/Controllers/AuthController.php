<?php
declare(strict_types=1);

namespace Src\Controllers;

use Core\Controller;
use Core\Interfaces\AuthSessionInterface;
use Core\Interfaces\HttpInterface;
use Core\Interfaces\SessionInterface;
use Core\Interfaces\ValidatorInterface;
use Core\Services\LoggerService;
use Exception;
use Src\DTO\LoginData;
use Src\DTO\RegisterData;
use Src\Exception\AuthException;
use Src\Service\AuthService;
use Src\Views\AuthView;

/**
 * AuthController
 * Handles authentication and acts as an orchestration layer.
 * All business logic is delegated to AuthService.
 */
class AuthController extends Controller {

    private AuthService $authService; // Auth service
    private AuthSessionInterface $auth; // Auth helper
    private HttpInterface $http;
    private ValidatorInterface $validator;
    private SessionInterface $session;
    private LoggerService $logger;

    public function __construct(
        AuthView $authView,
        AuthService $authService,
        AuthSessionInterface $auth,
        HttpInterface $http,
        ValidatorInterface $validator,
        SessionInterface $session,
        LoggerService $logger
    ) {
        $this->view = $authView;
        $this->authService = $authService;
        $this->auth = $auth;
        $this->http = $http;
        $this->validator = $validator;
        $this->session = $session;
        $this->logger = $logger;
    }

    /**
     * Displays authentication forms (login, register, join).
     * @param string $mode The active mode (login, register, join).
     */
    public function renderForm(string $mode): void
    {
        $validModes = ['login', 'register', 'join'];
        $currentMode = in_array($mode, $validModes) ? $mode : 'login';

        $this->view->setInitialMode($currentMode);
        $this->view->render();
    }

    /**
     * Handles user login.
     */
    public function login(): void
    {

        // Redirect if already logged in
        if ($this->auth->check() || $this->authService->tryAutoLogin()) {
            $this->http->redirect('');
        }

        // Define semantic schema
        $schema = [
            'login'    => 'text', // Accepts pseudo or email
            'password' => 'password'
        ];

        // Validate inputs fields
        $cleanData = $this->validator->run($_POST, $schema);
        if ($cleanData === false) {
            $this->redirectWithErrors('auth/login', $this->validator->getErrors());
            return;
        }

        // Prepare dto
        $dto = new LoginData(
            login: $cleanData['login'],
            password:  $cleanData['password'],
            remember: (bool) $this->http->post('remember_me')
        );

        // Attempt login
        $success = $this->authService->attemptLogin($dto);
        if ($success) {
            $this->session->setFlash($this->session::FLASH_SUCCESS, "Ravi de vous revoir !");
            $this->http->redirect('');
        } else {
            $this->session->setFlash($this->session::FLASH_ERROR, 'Identifiant ou mot de passe incorrect.');
            $this->http->redirect('auth/login');
        }
    }

    /**
     * Handles the register form submission (Standard Users & Teachers).
     */
    public function register(): void
    {

        if ($this->auth->check() || $this->authService->tryAutoLogin()) {
            $this->http->redirect('');
        }

        // Define semantic schema
        $schema = [
            'firstname'        => 'text',
            'lastname'         => 'text',
            'pseudo'           => 'username',
            'password'         => 'password',
            'confirm_password' => 'password_confirm',
            'email'            => 'email',
        ];

        $isTeacher = $this->http->post('is_teacher') === 'on';
        if ($isTeacher) {
            $schema['code'] = 'code';
        }

        // Validate inputs fields
        $cleanData = $this->validator->run($_POST, $schema);
        if ($cleanData === false) {
            $this->redirectWithErrors('auth/register', $this->validator->getErrors());
            return;
        }

        // Prepare dto
        $dto = new RegisterData(
            firstname: $cleanData['firstname'],
            lastname: $cleanData['lastname'],
            pseudo: $cleanData['pseudo'],
            password: $cleanData['password'],
            email: $cleanData['email'],
            teacherCode: $cleanData['teacher_code']
        );

        // Create User
        try {
            if ($isTeacher) {
                $this->authService->registerTeacher($dto);
            } else {
                $this->authService->registerStandardUser($dto);
            }

            $this->session->setFlash($this->session::FLASH_SUCCESS, "Compte créé avec succès ! Vous pouvez vous connecter.");
            $this->http->redirect('auth/login');

        } catch (AuthException $e) {
            $this->session->setFlash($this->session::FLASH_ERROR, $e->getMessage());
            $this->http->redirect('auth/register');

        } catch (Exception $e) {
            // TODO: peut être supprimer ce catch et laisser le controleur frontal s'en occuper
            // TODO: reflechir pour faire pareil pour tout les autres erreurs serveur
            $this->logger->error("Register Error: " . $e->getMessage());
            $this->session->setFlash($this->session::FLASH_ERROR, "Une erreur interne est survenue.");
            $this->http->redirect('auth/register');
        }
    }

    /**
     * Handles the "Join Class" form submission (Students).
     */
    public function join(): void
    {
        if ($this->auth->check() || $this->authService->tryAutoLogin()) {
            $this->http->redirect('');
        }

        // Define semantic schema
        $schema = [
            'firstname'        => 'text',
            'lastname'         => 'text',
            'pseudo'           => 'username',
            'password'         => 'password',
            'confirm_password' => 'password_confirm',
            'class_code'       => 'code',
        ];

        // Validate inputs fields
        $cleanData = $this->validator->run($_POST, $schema);
        if ($cleanData === false) {
            $this->redirectWithErrors('auth/join', $this->validator->getErrors());
            return;
        }

        // Prepare dto
        $dto = new RegisterData(
            firstname: $cleanData['firstname'],
            lastname: $cleanData['lastname'],
            pseudo: $cleanData['pseudo'],
            password: $cleanData['password'],
            teacherCode: $cleanData['class_code']
        );

        // Create user
        try {
            $this->authService->registerStudent($dto);

            $this->session->setFlash($this->session::FLASH_SUCCESS, "Bienvenue ! Vous avez rejoint la classe.");
            $this->http->redirect('auth/login');

        } catch (AuthException $e) {
            $this->session->setFlash($this->session::FLASH_ERROR, $e->getMessage());
            $this->http->redirect('auth/join');

        } catch (Exception $e) {
            $this->logger->error("Join Error: " . $e->getMessage());
            $this->session->setFlash($this->session::FLASH_ERROR, "Une erreur interne est survenue.");
            $this->http->redirect('auth/join');
        }
    }

    /**
     * Logs the user out.
     */
    public function logout(): void
    {
        $this->authService->logout();
        $this->http->redirect('');
    }
}