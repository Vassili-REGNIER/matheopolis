<?php

namespace Matheopolis\Adapter\Http\Exception\Client;

use Matheopolis\Adapter\Http\Exception\ClientErrorException;

class SessionExpiredException extends ClientErrorException
{
    public function __construct(
        string $message = 'Session has expired or the security token is invalid.',
        ?\Exception $previous = null
    ) {
        parent::__construct($message, 419, $previous);
    }
}
