<?php
namespace Core\Interfaces;

interface LoggerInterface {
    public function debug(string $message, array $context = []): void;
    public function info(string $message, array $context = []): void;
    public function warn(string $message, array $context = []): void;
    public function error(string $message, array $context = []): void;
}