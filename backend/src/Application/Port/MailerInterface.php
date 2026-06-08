<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

interface MailerInterface
{
    public function send(string $to, string $subject, string $body): void;
}
