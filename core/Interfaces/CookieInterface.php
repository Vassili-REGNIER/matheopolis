<?php
namespace Core\Interfaces;

interface CookieInterface {
    public function set(string $name, string $value, int $minutes = 60): void;
    public function get(string $name, mixed $default = null): mixed;
    public function has(string $name): bool;
    public function remove(string $name): void;
}