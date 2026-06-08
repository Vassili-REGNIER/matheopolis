<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Mail;

use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Application\Port\MailerInterface;

final class LogMailer implements MailerInterface
{
    public function __construct(
        private readonly LoggerInterface $logger,
    ) {}

    public function send(string $to, string $subject, string $body): void
    {
        $this->logger->info('Mail queued', [
            'to' => $to,
            'subject' => $subject,
            'body' => $body,
        ]);
    }
}
