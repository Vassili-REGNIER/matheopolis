<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Security;

use Matheopolis\Adapter\Http\Contract\SecurityInterface;
use Matheopolis\Application\Port\SessionInterface;

final class SecurityService implements SecurityInterface
{
    public function __construct(
        private readonly SessionInterface $session,
    ) {}

    public function escape(string $string): string
    {
        return htmlentities($string, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    public function csrfField(): string
    {
        $token = $this->session->getCsrfToken();

        return '<input type="hidden" name="csrf_token" value="'.$this->escape($token).'">';
    }
}
