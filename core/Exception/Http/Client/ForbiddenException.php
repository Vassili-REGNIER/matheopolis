<?php

namespace Core\Exception\Http\Client;
use Core\Exception\Http\ClientErrorException;
use Exception;

class ForbiddenException extends ClientErrorException
{
    public function __construct(
        string $message = "Access denied.",
        ?Exception $previous = null
    ) {
        parent::__construct($message, 403, $previous);
    }
}
