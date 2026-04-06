<?php

namespace Matheopolis\Adapter\Http\Exception\Client;

use Matheopolis\Adapter\Http\Exception\ClientErrorException;

class BadRequestException extends ClientErrorException
{
    public function __construct(
        string $message = 'Invalid request.',
        ?\Exception $previous = null
    ) {
        parent::__construct($message, 400, $previous);
    }
}
