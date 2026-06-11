<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Port\AuthTokenRepositoryInterface;
use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\MailerInterface;

/**
 * Coordinates auth token application behavior.
 */
final class AuthTokenService
{
    /**
     * Creates a new AuthTokenService instance.
     */
    public function __construct(
        private readonly AuthTokenRepositoryInterface $tokens,
        private readonly MailerInterface $mailer,
        private readonly ConfigInterface $config,
    ) {}

    /**
     * Checks whether the sue email verification condition is met.
     */
    public function issueEmailVerification(int $userId, string $email, string $firstName): string
    {
        return $this->issueToken(
            $userId,
            'email_verification',
            $email,
            'Confirm your Matheopolis account',
            $firstName,
            '/verify-email?token=',
            48,
        );
    }

    /**
     * Checks whether the sue password reset condition is met.
     */
    public function issuePasswordReset(int $userId, string $email, string $firstName): string
    {
        return $this->issueToken(
            $userId,
            'password_reset',
            $email,
            'Reset your Matheopolis password',
            $firstName,
            '/reset-password?token=',
            2,
        );
    }

    /**
     * Resolve user ID.
     */
    public function resolveUserId(string $plainToken, string $type): ?int
    {
        return $this->tokens->findValidUserIdByTokenHash($this->hashToken($plainToken), $type);
    }

    /**
     * Consume token.
     */
    public function consumeToken(string $plainToken): void
    {
        $this->tokens->deleteByTokenHash($this->hashToken($plainToken));
    }

    /**
     * Checks whether the sue token condition is met.
     */
    private function issueToken(
        int $userId,
        string $type,
        string $email,
        string $subject,
        string $firstName,
        string $frontendPath,
        int $ttlHours,
    ): string {
        $this->tokens->deleteByUserAndType($userId, $type);

        $plainToken = bin2hex(random_bytes(32));
        $expiresAt = gmdate('Y-m-d H:i:s', time() + ($ttlHours * 3600));
        $this->tokens->create($userId, $this->hashToken($plainToken), $type, $expiresAt);

        $frontendOrigin = rtrim($this->config->getString('APP_FRONTEND_ORIGIN', 'http://localhost:5173'), '/');
        $link = $frontendOrigin.$frontendPath.urlencode($plainToken);
        $body = "Hello {$firstName},\n\nPlease open the link below:\n{$link}\n\nThis link expires in {$ttlHours} hour(s).";

        $this->mailer->send($email, $subject, $body);

        return $plainToken;
    }

    /**
     * Checks whether the h token exists.
     */
    private function hashToken(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }
}
