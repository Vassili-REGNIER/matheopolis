<?php

namespace Matheopolis\Adapter\Http\Exception\Client;

use Matheopolis\Adapter\Http\Exception\ClientErrorException;

class TooManyRequestsException extends ClientErrorException
{
    public function __construct(
        string $message = 'Too many attempts. Please try again later.',
        ?\Exception $previous = null
    ) {
        parent::__construct($message, 429, $previous);
    }
}
