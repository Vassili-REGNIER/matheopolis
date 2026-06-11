<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Auth;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Application\Port\SessionInterface;

/**
 * Coordinates auth session application behavior.
 */
final class AuthSessionService implements AuthSessionInterface
{
    /**
     * Creates a new AuthSessionService instance.
     */
    public function __construct(
        private readonly SessionInterface $session,
        private readonly LoggerInterface $logger,
        private readonly ConfigInterface $config,
    ) {}

    /**
     * Check.
     */
    public function check(): bool
    {
        return null !== $this->id();
    }

    /**
     * Id.
     */
    public function id(): ?int
    {
        $key = $this->config->getString('USER_COOKIE');
        $value = $this->session->get($key);

        return \is_int($value) ? $value : (is_numeric($value) ? (int) $value : null);
    }

    /**
     * Login.
     */
    public function login(int $id): void
    {
        $this->session->regenerate(true);
        $key = $this->config->getString('USER_COOKIE');
        $this->session->set($key, $id);
        $this->session->ensureCsrfToken();
    }

    /**
     * Logout.
     */
    public function logout(): void
    {
        $this->logger->info('User '.($this->id() ?? 'unknown').' logged out.');
        $this->session->end();
    }
}
