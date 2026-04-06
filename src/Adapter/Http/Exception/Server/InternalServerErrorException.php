<?php

namespace Matheopolis\Adapter\Http\Exception\Server;

use Matheopolis\Adapter\Http\Exception\ServerErrorException;

class InternalServerErrorException extends ServerErrorException
{
    public function __construct(
        string $message = 'An internal error occurred.',
        ?\Exception $previous = null
    ) {
        parent::__construct($message, 500, $previous);
    }
}
