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
        string $email,
        string $password,
    ): User {
        $this->validateName($firstName, 'firstName');
        $this->validateName($lastName, 'lastName');
        $this->validateEmail($email);
        $this->validatePassword($password);

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
        $username = $this->generateUniqueUsername($firstName, $lastName);

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

    public function registerAccount(
        string $firstName,
        string $lastName,
        string $email,
        string $password,
    ): User {
        $this->validateName($firstName, 'firstName');
        $this->validateName($lastName, 'lastName');
        $this->validateEmail($email);
        $this->validatePassword($password);

        if (null !== $this->users->findByLogin($email)) {
            throw new ApiException(409, 'CONFLICT', 'Email already exists.');
        }

        $role = $this->academyEmailPolicy->isAllowedTeacherEmail($email) ? 'teacher' : 'free_user';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $username = $this->generateUniqueUsername($firstName, $lastName);

        return $this->users->insert(new RegistrationDetails(
            $firstName,
            $lastName,
            $username,
            $hashedPassword,
            $role,
            $email,
            null,
        ));
    }

    public function registerStudent(
        string $firstName,
        string $lastName,
        string $password,
        ?string $classCode = null,
    ): User {
        $this->validateName($firstName, 'firstName');
        $this->validateName($lastName, 'lastName');
        $this->validatePassword($password);

        $classCode = null !== $classCode ? trim($classCode) : '';
        if ('' === $classCode) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Class code is required.');
        }

        $class = $this->classes->findByCode($classCode);
        if (null === $class) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid class code.');
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $username = $this->generateUniqueUsername($firstName, $lastName);

        return $this->users->insert(new RegistrationDetails(
            $firstName,
            $lastName,
            $username,
            $hashedPassword,
            'student',
            null,
            $class->getId(),
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
        if (1 !== preg_match('/^[a-zA-Z0-9_.-]{3,80}$/', $username)) {
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

    private function generateUniqueUsername(string $firstName, string $lastName): string
    {
        $base = $this->buildUsernameBase($firstName, $lastName);

        for ($index = 1; $index <= 9999; ++$index) {
            $suffix = (string) $index;
            $maxBaseLength = 80 - mb_strlen($suffix);
            $candidate = mb_substr($base, 0, $maxBaseLength).$suffix;
            $this->validateUsername($candidate);

            if (null === $this->users->findByUsername($candidate)) {
                return $candidate;
            }
        }

        throw new ApiException(409, 'CONFLICT', 'No available username could be generated.');
    }

    private function buildUsernameBase(string $firstName, string $lastName): string
    {
        $firstPart = $this->normalizeUsernamePart($firstName);
        $lastPart = $this->normalizeUsernamePart($lastName);

        if ('' !== $firstPart && '' !== $lastPart) {
            return $firstPart.'.'.$lastPart;
        }

        $base = '' !== $firstPart ? $firstPart : $lastPart;

        return mb_strlen($base) >= 2 ? $base : 'user';
    }

    private function normalizeUsernamePart(string $value): string
    {
        $value = strtolower(trim(strtr($value, [
            'À' => 'A',
            'Á' => 'A',
            'Â' => 'A',
            'Ã' => 'A',
            'Ä' => 'A',
            'Å' => 'A',
            'Æ' => 'AE',
            'Ç' => 'C',
            'È' => 'E',
            'É' => 'E',
            'Ê' => 'E',
            'Ë' => 'E',
            'Ì' => 'I',
            'Í' => 'I',
            'Î' => 'I',
            'Ï' => 'I',
            'Ñ' => 'N',
            'Ò' => 'O',
            'Ó' => 'O',
            'Ô' => 'O',
            'Õ' => 'O',
            'Ö' => 'O',
            'Ù' => 'U',
            'Ú' => 'U',
            'Û' => 'U',
            'Ü' => 'U',
            'Ý' => 'Y',
            'Œ' => 'OE',
            'à' => 'a',
            'á' => 'a',
            'â' => 'a',
            'ã' => 'a',
            'ä' => 'a',
            'å' => 'a',
            'æ' => 'ae',
            'ç' => 'c',
            'è' => 'e',
            'é' => 'e',
            'ê' => 'e',
            'ë' => 'e',
            'ì' => 'i',
            'í' => 'i',
            'î' => 'i',
            'ï' => 'i',
            'ñ' => 'n',
            'ò' => 'o',
            'ó' => 'o',
            'ô' => 'o',
            'õ' => 'o',
            'ö' => 'o',
            'ù' => 'u',
            'ú' => 'u',
            'û' => 'u',
            'ü' => 'u',
            'ý' => 'y',
            'ÿ' => 'y',
            'œ' => 'oe',
        ])));

        return preg_replace('/[^a-z0-9]+/', '', $value) ?? '';
    }
}
