<?php

namespace Core\Exception\Http\Server;

use Core\Exception\Http\ServerErrorException;
use Exception;

class InternalServerErrorException extends ServerErrorException
{
    public function __construct(
        string $message = "An internal error occurred.",
        ?Exception $previous = null
    ) {
        parent::__construct($message, 500, $previous);
    }
}