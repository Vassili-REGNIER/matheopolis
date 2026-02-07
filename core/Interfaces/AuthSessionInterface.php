<?php
namespace Core\Interfaces;

interface AuthSessionInterface {
    public function check(): bool;
    public function id(): ?int;
    public function login(int $id): void;
    public function logout(): void;
}