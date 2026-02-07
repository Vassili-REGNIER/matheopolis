<?php

namespace Src\DTO;

class RegisterData
{
    public function __construct(
        public string $firstname,
        public string $lastname,
        public string $pseudo,
        public string $password,
        public ?string $role = null,
        public ?string $email = null,
        public ?string $teacherCode = null,
        public ?string $classCode = null,
        public ?int $classId = null,
        public ?string $createdAt = null
    ) {}
}