<?php

namespace Matheopolis\Adapter\Http\Exception\Client;

use Matheopolis\Adapter\Http\Exception\ClientErrorException;

class NotFoundException extends ClientErrorException
{
    public function __construct(
        string $message = 'Resource not found.',
        ?\Exception $previous = null
    ) {
        parent::__construct($message, 404, $previous);
    }
}
