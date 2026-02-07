<?php

namespace Core\Exception\Http\Client;

use Core\Exception\Http\ClientErrorException;
use Exception;

class MethodNotAllowedException extends ClientErrorException
{
    public function __construct(
        string $message = "Method not allowed.",
        ?Exception $previous = null
    ) {
        parent::__construct($message, 405, $previous);
    }
}
