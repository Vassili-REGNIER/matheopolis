<?php
namespace Core\Interfaces;

interface SecurityInterface {
    public function escape(string $string): string;
    public function csrfField(): string;
}