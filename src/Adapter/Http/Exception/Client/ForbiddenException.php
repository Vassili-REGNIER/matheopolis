<?php

namespace Matheopolis\Adapter\Http\Exception\Client;

use Matheopolis\Adapter\Http\Exception\ClientErrorException;

class ForbiddenException extends ClientErrorException
{
    public function __construct(
        string $message = 'Access denied.',
        ?\Exception $previous = null
    ) {
        parent::__construct($message, 403, $previous);
    }
}
