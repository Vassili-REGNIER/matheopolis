<?php

namespace Matheopolis\Adapter\Http\Exception\Client;

use Matheopolis\Adapter\Http\Exception\ClientErrorException;

class UnauthorizedException extends ClientErrorException
{
    public function __construct(
        string $message = 'Access denied',
        ?\Exception $previous = null
    ) {
        parent::__construct($message, 401, $previous);
    }
}
