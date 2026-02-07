<?php

namespace Core\Exception\Http\Client;

use Core\Exception\Http\ClientErrorException;
use Exception;

class NotFoundException extends ClientErrorException
{
    public function __construct(
        string $message = "Resource not found.",
        ?Exception $previous = null
    ) {
        parent::__construct($message, 404, $previous);
    }
}
