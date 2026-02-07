<?php
namespace Core\Interfaces;

interface ValidatorInterface {
    public function run(array $source, array $schema): array|false;
    public function getErrors(): array;
}