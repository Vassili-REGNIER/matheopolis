<?php

namespace Matheopolis\Adapter\Http\Exception;

class ServerErrorException extends HttpException
{
    public function __construct(
        string $message = 'Server error.',
        int $statusCode = 500,
        ?\Exception $previous = null
    ) {
        parent::__construct($message, $statusCode, $previous);
    }
}
