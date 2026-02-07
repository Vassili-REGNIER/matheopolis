<?php

namespace Core\Exception\Http\Client;
use Core\Exception\Http\ClientErrorException;
use Exception;

class SessionExpiredException extends ClientErrorException
{
    public function __construct(
        string $message = "Session has expired or the security token is invalid.",
        ?Exception $previous = null
    ) {
        parent::__construct($message, 419, $previous);
    }
}
