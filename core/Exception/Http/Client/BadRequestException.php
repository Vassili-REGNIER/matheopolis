<?php

namespace Core\Exception\Http\Client;

use Core\Exception\Http\ClientErrorException;
use Exception;

class BadRequestException extends ClientErrorException
{
    public function __construct(
        string $message = "Invalid request.",
        ?Exception $previous = null
    ) {
        parent::__construct($message, 400, $previous);
    }
}