<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Adapter\Http\Contract\HttpInterface;
use Matheopolis\Adapter\Http\View\AuthView;
use Matheopolis\Application\Command\LoginUserCommand;
use Matheopolis\Application\Command\RegisterStandardUserCommand;
use Matheopolis\Application\Command\RegisterStudentCommand;
use Matheopolis\Application\Command\RegisterTeacherCommand;
use Matheopolis\Application\CommandHandler\LoginUserCommandHandler;
use Matheopolis\Application\CommandHandler\LogoutUserCommandHandler;
use Matheopolis\Application\CommandHandler\RegisterStandardUserCommandHandler;
use Matheopolis\Application\CommandHandler\RegisterStudentCommandHandler;
use Matheopolis\Application\CommandHandler\RegisterTeacherCommandHandler;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\ValidatorInterface;
use Matheopolis\Application\Query\TryAutoLoginQuery;
use Matheopolis\Application\QueryHandler\TryAutoLoginQueryHandler;
use Matheopolis\Domain\Exception\AuthException;

final class AuthController extends AbstractController
{
    public function __construct(
        private readonly AuthView $authView,
        private readonly LoginUserCommandHandler $loginUser,
        private readonly LogoutUserCommandHandler $logoutUser,
        private readonly RegisterStandardUserCommandHandler $registerStandard,
        private readonly RegisterTeacherCommandHandler $registerTeacher,
        private readonly RegisterStudentCommandHandler $registerStudent,
        private readonly TryAutoLoginQueryHandler $tryAutoLogin,
        private readonly AuthSessionInterface $auth,
        private readonly HttpInterface $http,
        private readonly ValidatorInterface $validator,
        private readonly SessionInterface $session,
        private readonly LoggerInterface $logger,
    ) {
        $this->view = $authView;
    }

    public function renderForm(string $mode): void
    {
        $validModes = ['login', 'register', 'join'];
        $currentMode = \in_array($mode, $validModes, true) ? $mode : 'login';

        $this->authView->setInitialMode($currentMode);
        $this->authView->render();
    }

    public function login(): void
    {
        if ($this->auth->check() || $this->tryAutoLogin->handle(new TryAutoLoginQuery())) {
            $this->http->redirect('');
        }

        $schema = [
            'login' => 'text',
            'password' => 'password',
        ];

        $cleanData = $this->validator->run($this->postData(), $schema);
        if (false === $cleanData) {
            $this->redirectWithErrors($this->http, $this->session, 'auth/login', $this->validator->getErrors());

            return;
        }

        $rememberRaw = $this->http->post('remember_me');
        $remember = 'on' === $rememberRaw || true === $rememberRaw;

        $success = $this->loginUser->handle(new LoginUserCommand(
            login: $this->requireStr($cleanData, 'login'),
            password: $this->requireStr($cleanData, 'password'),
            remember: $remember,
        ));
        if ($success) {
            $this->session->setFlash(SessionInterface::FLASH_SUCCESS, 'Ravi de vous revoir !');
            $this->http->redirect('');
        }

        $this->session->setFlash(SessionInterface::FLASH_ERROR, 'Identifiant ou mot de passe incorrect.');
        $this->http->redirect('auth/login');
    }

    public function register(): void
    {
        if ($this->auth->check() || $this->tryAutoLogin->handle(new TryAutoLoginQuery())) {
            $this->http->redirect('');
        }

        $schema = [
            'firstname' => 'text',
            'lastname' => 'text',
            'pseudo' => 'username',
            'password' => 'password',
            'confirm_password' => 'password_confirm',
            'email' => 'email',
        ];

        $isTeacher = 'on' === $this->http->post('is_teacher');
        if ($isTeacher) {
            $schema['code'] = 'code';
        }

        $cleanData = $this->validator->run($this->postData(), $schema);
        if (false === $cleanData) {
            $this->redirectWithErrors($this->http, $this->session, 'auth/register', $this->validator->getErrors());

            return;
        }

        try {
            if ($isTeacher) {
                $this->registerTeacher->handle(new RegisterTeacherCommand(
                    firstname: $this->requireStr($cleanData, 'firstname'),
                    lastname: $this->requireStr($cleanData, 'lastname'),
                    pseudo: $this->requireStr($cleanData, 'pseudo'),
                    password: $this->requireStr($cleanData, 'password'),
                    email: $this->requireStr($cleanData, 'email'),
                    teacherInvitationCode: $this->requireStr($cleanData, 'code'),
                ));
            } else {
                $this->registerStandard->handle(new RegisterStandardUserCommand(
                    firstname: $this->requireStr($cleanData, 'firstname'),
                    lastname: $this->requireStr($cleanData, 'lastname'),
                    pseudo: $this->requireStr($cleanData, 'pseudo'),
                    password: $this->requireStr($cleanData, 'password'),
                    email: $this->requireStr($cleanData, 'email'),
                ));
            }

            $this->session->setFlash(SessionInterface::FLASH_SUCCESS, 'Compte créé avec succès ! Vous pouvez vous connecter.');
            $this->http->redirect('auth/login');
        } catch (AuthException $e) {
            $this->session->setFlash(SessionInterface::FLASH_ERROR, $e->getMessage());
            $this->http->redirect('auth/register');
        } catch (\Exception $e) {
            $this->logger->error('Register error: '.$e->getMessage());
            $this->session->setFlash(SessionInterface::FLASH_ERROR, 'Une erreur interne est survenue.');
            $this->http->redirect('auth/register');
        }
    }

    public function join(): void
    {
        if ($this->auth->check() || $this->tryAutoLogin->handle(new TryAutoLoginQuery())) {
            $this->http->redirect('');
        }

        $schema = [
            'firstname' => 'text',
            'lastname' => 'text',
            'pseudo' => 'username',
            'password' => 'password',
            'confirm_password' => 'password_confirm',
            'class_code' => 'code',
        ];

        $cleanData = $this->validator->run($this->postData(), $schema);
        if (false === $cleanData) {
            $this->redirectWithErrors($this->http, $this->session, 'auth/join', $this->validator->getErrors());

            return;
        }

        try {
            $this->registerStudent->handle(new RegisterStudentCommand(
                firstname: $this->requireStr($cleanData, 'firstname'),
                lastname: $this->requireStr($cleanData, 'lastname'),
                pseudo: $this->requireStr($cleanData, 'pseudo'),
                password: $this->requireStr($cleanData, 'password'),
                classCode: $this->requireStr($cleanData, 'class_code'),
            ));
            $this->session->setFlash(SessionInterface::FLASH_SUCCESS, 'Bienvenue ! Vous avez rejoint la classe.');
            $this->http->redirect('auth/login');
        } catch (AuthException $e) {
            $this->session->setFlash(SessionInterface::FLASH_ERROR, $e->getMessage());
            $this->http->redirect('auth/join');
        } catch (\Exception $e) {
            $this->logger->error('Join class error: '.$e->getMessage());
            $this->session->setFlash(SessionInterface::FLASH_ERROR, 'Une erreur interne est survenue.');
            $this->http->redirect('auth/join');
        }
    }

    public function logout(): void
    {
        $this->logoutUser->handle();
        $this->http->redirect('');
    }

    /**
     * @return array<string, mixed>
     */
    private function postData(): array
    {
        $out = [];
        foreach ($_POST as $key => $value) {
            if (\is_string($key)) {
                $out[$key] = $value;
            }
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function requireStr(array $data, string $key): string
    {
        $v = $data[$key] ?? null;
        if (\is_string($v)) {
            return $v;
        }
        if (\is_scalar($v)) {
            return (string) $v;
        }

        return '';
    }
}
