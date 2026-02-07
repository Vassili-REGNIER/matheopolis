<?php

namespace Core\Exception\Http\Client;
use Exception;

class CsrfException extends SessionExpiredException
{
    public function __construct(
        string $message = "Invalid CSRF token.",
        ?Exception $previous = null
    ) {
        parent::__construct($message,  $previous);
    }
}