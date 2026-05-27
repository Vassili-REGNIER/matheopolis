<?php

namespace Matheopolis\Adapter\Http\Exception\Client;

class CsrfException extends SessionExpiredException
{
    public function __construct(
        string $message = 'Invalid CSRF token.',
        ?\Exception $previous = null
    ) {
        parent::__construct($message, $previous);
    }
}
