<?php

namespace Core\Exception\Http\Client;

use Core\Exception\Http\ClientErrorException;
use Exception;

class TooManyRequestsException extends ClientErrorException
{
    public function __construct(
        string $message = "Too many attempts. Please try again later.",
        ?Exception $previous = null
    ) {
        parent::__construct($message, 429, $previous);
    }
}
