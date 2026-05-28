<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Domain\User;

final class ApiUserService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly ClassroomRepositoryInterface $classes,
        private readonly AcademyEmailPolicy $academyEmailPolicy,
    ) {}

    public function registerTeacher(
        string $firstName,
        string $lastName,
        string $username,
        string $email,
        string $password,
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

        if (!$this->academyEmailPolicy->isAllowedTeacherEmail($email)) {
            throw new ApiException(
                422,
                'INVALID_TEACHER_EMAIL_DOMAIN',
                'Teacher registration requires an academic email domain.',
            );
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        return $this->users->insert(new RegistrationDetails(
            $firstName,
            $lastName,
            $username,
            $hashedPassword,
            'teacher',
            $email,
            null,
        ));
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

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        return $this->users->insert(new RegistrationDetails(
            $firstName,
            $lastName,
            $username,
            $hashedPassword,
            'student',
            null,
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
        if (1 !== preg_match('/^[a-zA-Z0-9_-]{3,32}$/', $username)) {
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
