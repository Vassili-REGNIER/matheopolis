<?php
declare(strict_types=1);

namespace Core\Services;

use Core\Interfaces\AuthSessionInterface;
use Core\Interfaces\ConfigInterface;
use Core\Interfaces\LoggerInterface;
use Core\Interfaces\SessionInterface;

final class AuthSessionService implements AuthSessionInterface
{
    private SessionInterface $session;
    private LoggerInterface $logger;
    private ConfigInterface $config;

    public function __construct(SessionInterface $session, LoggerInterface $logger, ConfigInterface $config) {
        $this->session = $session;
        $this->logger = $logger;
        $this->config = $config;
    }

    /**
     * Checks if the user is logged in.
     * @return bool
     */
    public function check(): bool
    {
        return $this->id() !== null;
    }


    /**
     * Retrieves the ID of the logged-in user.
     * @return int|null
     */
    public function id(): ?int
    {
        $key = $this->config->getString('USER_COOKIE');
        return $this->session->get($key);
    }

    /**
     * Manually connects a user (after verifying the password).
     * @param int $id
     */
    public function login(int $id): void
    {
        $key = $this->config->getString('USER_COOKIE');
        $this->session->set($key, $id);
        $this->session->ensureCsrfToken();
    }

    /**
     * Disconnect the user.
     */
    public function logout(): void
    {
        $this->logger->info("User " . $this->id() . " logged out.");

        // Clear the server session
        $this->session->end();
    }
}