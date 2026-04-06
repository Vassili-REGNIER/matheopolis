<?php

namespace Matheopolis\Adapter\Http\Exception\Client;

use Matheopolis\Adapter\Http\Exception\ClientErrorException;

class MethodNotAllowedException extends ClientErrorException
{
    public function __construct(
        string $message = 'Method not allowed.',
        ?\Exception $previous = null
    ) {
        parent::__construct($message, 405, $previous);
    }
}
