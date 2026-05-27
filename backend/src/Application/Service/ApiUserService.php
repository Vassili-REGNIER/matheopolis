<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\TeacherCodeRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Domain\User;

final class ApiUserService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly TeacherCodeRepositoryInterface $teacherCodes,
        private readonly ClassroomRepositoryInterface $classes,
    ) {}

    public function registerTeacher(
        string $firstName,
        string $lastName,
        string $username,
        string $email,
        string $password,
        string $teacherCode,
    ): User {
        $this->validateName($firstName, 'firstName');
        $this->validateName($lastName, 'lastName');
        $this->validateUsername($username);
        $this->validateEmail($email);
        $this->validatePassword($password);

        if (null !== $this->users->findByUsername($username)) {
            throw new ApiException(409, 'CONFLICT', 'Username already exists.');
        }

        if (null !== $this->users->findByLogin($email)) {
            throw new ApiException(409, 'CONFLICT', 'Email already exists.');
        }

        $codeEntity = $this->teacherCodes->findByCode($teacherCode);
        if (null === $codeEntity || 'active' !== $codeEntity->getStatus()) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid teacher code.');
        }

        $created = $this->users->insert(new RegistrationDetails(
            $firstName,
            $lastName,
            $username,
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            'teacher',
            null,
        ));

        $this->teacherCodes->markAsUsed($codeEntity->getId(), $created->getId());

        return $created;
    }

    public function registerStudent(
        string $firstName,
        string $lastName,
        string $username,
        string $password,
        ?string $classCode = null,
    ): User {
        $this->validateName($firstName, 'firstName');
        $this->validateName($lastName, 'lastName');
        $this->validateUsername($username);
        $this->validatePassword($password);

        if (null !== $this->users->findByUsername($username)) {
            throw new ApiException(409, 'CONFLICT', 'Username already exists.');
        }

        $classId = null;
        if (null !== $classCode && '' !== trim($classCode)) {
            $class = $this->classes->findByCode(trim($classCode));
            if (null === $class) {
                throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid class code.');
            }
            $classId = $class->getId();
        }

        return $this->users->insert(new RegistrationDetails(
            $firstName,
            $lastName,
            $username,
            null,
            password_hash($password, PASSWORD_DEFAULT),
            'student',
            $classId,
        ));
    }

    private function validateName(string $value, string $field): void
    {
        $value = trim($value);
        if ('' === $value || mb_strlen($value) > 120) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid '.$field.'.');
        }
    }

    private function validateUsername(string $username): void
    {
        $username = trim($username);
        if (!preg_match('/^[a-zA-Z0-9_-]{3,32}$/', $username)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid username.');
        }
    }

    private function validateEmail(string $email): void
    {
        if (false === filter_var(trim($email), FILTER_VALIDATE_EMAIL)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid email.');
        }
    }

    private function validatePassword(string $password): void
    {
        if (mb_strlen($password) < 8) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Password must be at least 8 characters.');
        }
    }
}
