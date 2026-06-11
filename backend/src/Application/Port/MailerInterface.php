<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

/**
 * Defines the contract for the mailer dependency.
 */
interface MailerInterface
{
    /**
     * Send.
     */
    public function send(string $to, string $subject, string $body): void;
}
