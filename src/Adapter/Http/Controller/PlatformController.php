<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Adapter\Http\Middleware\AuthMiddleware;
use Matheopolis\Adapter\Http\Middleware\CsrfMiddleware;
use Matheopolis\Adapter\Http\View\PlatformView;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\ValidatorInterface;
use Matheopolis\Application\Service\PlatformService;
use Matheopolis\Domain\Exception\AuthException;
use Matheopolis\Domain\User;

final class PlatformController extends AbstractController
{
    public function __construct(
        private readonly PlatformView $platformView,
        private readonly PlatformService $platformService,
        private readonly AuthSessionInterface $auth,
        private readonly HttpInterface $http,
        private readonly SessionInterface $session,
        private readonly ValidatorInterface $validator,
        private readonly LoggerInterface $logger,
        AuthMiddleware $authMiddleware,
        CsrfMiddleware $csrfMiddleware,
    ) {
        $this->view = $platformView;
        $this->registerBeforeMiddleware($authMiddleware);
        $this->registerBeforeMiddleware($csrfMiddleware);
    }

    public function dashboard(): void
    {
        $user = $this->getCurrentUserOrRedirect();
        if (null === $user) {
            return;
        }

        $this->platformView->setUser($user);
        $this->platformView->setDashboardData($this->platformService->getDashboardData($user));
        $this->platformView->render();
    }

    public function createTeacherCode(): void
    {
        $user = $this->getCurrentUserOrRedirect();
        if (null === $user) {
            return;
        }

        try {
            $code = $this->platformService->createTeacherCode($user);
            $this->session->setFlash(SessionInterface::FLASH_SUCCESS, "Teacher activation code created: {$code}");
        } catch (AuthException $exception) {
            $this->session->setFlash(SessionInterface::FLASH_ERROR, $exception->getMessage());
        }

        $this->http->redirect('dashboard');
    }

    public function createClassroom(): void
    {
        $user = $this->getCurrentUserOrRedirect();
        if (null === $user) {
            return;
        }

        $cleanData = $this->validator->run($this->postData(), ['name' => 'text']);
        if (false === $cleanData) {
            $this->redirectWithErrors($this->http, $this->session, 'dashboard', $this->validator->getErrors());

            return;
        }

        try {
            $this->platformService->createClassroom($user, (string) $cleanData['name']);
            $this->session->setFlash(SessionInterface::FLASH_SUCCESS, 'Class created.');
        } catch (AuthException $exception) {
            $this->session->setFlash(SessionInterface::FLASH_ERROR, $exception->getMessage());
        }

        $this->http->redirect('dashboard');
    }

    public function resetStudentPassword(): void
    {
        $user = $this->getCurrentUserOrRedirect();
        if (null === $user) {
            return;
        }

        $cleanData = $this->validator->run($this->postData(), [
            'student_id' => 'integer',
            'password' => 'password',
            'confirm_password' => 'password_confirm',
        ]);
        if (false === $cleanData) {
            $this->redirectWithErrors($this->http, $this->session, 'dashboard', $this->validator->getErrors());

            return;
        }

        try {
            $this->platformService->resetStudentPassword(
                $user,
                (int) $cleanData['student_id'],
                (string) $cleanData['password'],
            );
            $this->session->setFlash(SessionInterface::FLASH_SUCCESS, 'Student password reset.');
        } catch (AuthException $exception) {
            $this->session->setFlash(SessionInterface::FLASH_ERROR, $exception->getMessage());
        }

        $this->http->redirect('dashboard');
    }

    public function createPuzzle(): void
    {
        $user = $this->getCurrentUserOrRedirect();
        if (null === $user) {
            return;
        }

        $cleanData = $this->validator->run($this->postData(), [
            'title' => 'text',
            'statement' => 'text',
            'position' => 'integer',
        ]);
        if (false === $cleanData) {
            $this->redirectWithErrors($this->http, $this->session, 'dashboard', $this->validator->getErrors());

            return;
        }

        try {
            $this->platformService->createPuzzle(
                $user,
                (string) $cleanData['title'],
                (string) $cleanData['statement'],
                (int) $cleanData['position'],
            );
            $this->session->setFlash(SessionInterface::FLASH_SUCCESS, 'Puzzle saved.');
        } catch (AuthException $exception) {
            $this->session->setFlash(SessionInterface::FLASH_ERROR, $exception->getMessage());
        }

        $this->http->redirect('dashboard');
    }

    public function solvePuzzle(): void
    {
        $user = $this->getCurrentUserOrRedirect();
        if (null === $user) {
            return;
        }

        $cleanData = $this->validator->run($this->postData(), ['puzzle_id' => 'integer']);
        if (false === $cleanData) {
            $this->redirectWithErrors($this->http, $this->session, 'dashboard', $this->validator->getErrors());

            return;
        }

        try {
            $this->platformService->solvePuzzle($user, (int) $cleanData['puzzle_id']);
            $this->session->setFlash(SessionInterface::FLASH_SUCCESS, 'Puzzle marked as solved.');
        } catch (AuthException $exception) {
            $this->session->setFlash(SessionInterface::FLASH_ERROR, $exception->getMessage());
        }

        $this->http->redirect('dashboard');
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

    private function getCurrentUserOrRedirect(): ?User
    {
        if (!$this->auth->check()) {
            $this->http->redirect('auth/login');
        }

        $user = $this->platformService->currentUser();
        if (null === $user) {
            $this->logger->warn('Session user id does not resolve to a real user.');
            $this->http->redirect('auth/login');
        }

        return $user;
    }
}
