<?php

namespace Matheopolis\Adapter\Http\Exception;

class ClientErrorException extends HttpException
{
    public function __construct(
        string $message = 'Client error.',
        int $statusCode = 400,
        ?\Exception $previous = null
    ) {
        parent::__construct($message, $statusCode, $previous);
    }
}
