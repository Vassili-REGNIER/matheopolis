<?php

namespace Core\Exception\Http\Client;
use Core\Exception\Http\ClientErrorException;
use Exception;

class UnauthorizedException extends ClientErrorException
{
    public function __construct(
        string $message = "Access denied",
        ?Exception $previous = null
    ) {
        parent::__construct($message, 401, $previous);
    }
}