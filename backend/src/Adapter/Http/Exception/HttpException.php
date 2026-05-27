<?php

namespace Matheopolis\Adapter\Http\Exception;

class HttpException extends \Exception
{
    protected int $statusCode = 500;

    public function __construct(
        string $message = '',
        int $statusCode = 500,
        ?\Exception $previous = null
    ) {
        parent::__construct($message, 0, $previous);
        $this->statusCode = $statusCode;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
