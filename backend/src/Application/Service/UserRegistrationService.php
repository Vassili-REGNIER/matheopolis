<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\TeacherCodeRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Domain\User;

/**
 * Backward-compatible registration service kept for legacy command handlers.
 */
final class UserRegistrationService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly TeacherCodeRepositoryInterface $teacherCodes,
        private readonly ClassroomRepositoryInterface $classes,
    ) {}

    public function registerStandard(string $firstName, string $lastName, string $username, string $password, string $email): User
    {
        return $this->users->insert(new RegistrationDetails(
            trim($firstName),
            trim($lastName),
            trim($username),
            trim($email),
            password_hash($password, PASSWORD_DEFAULT),
            'student',
            null,
        ));
    }

    public function registerTeacher(string $firstName, string $lastName, string $username, string $password, string $email, string $teacherInvitationCode): User
    {
        $created = $this->users->insert(new RegistrationDetails(
            trim($firstName),
            trim($lastName),
            trim($username),
            trim($email),
            password_hash($password, PASSWORD_DEFAULT),
            'teacher',
            null,
        ));

        $code = $this->teacherCodes->findByCode(trim($teacherInvitationCode));
        if (null !== $code && 'active' === $code->getStatus()) {
            $this->teacherCodes->markAsUsed($code->getId(), $created->getId());
        }

        return $created;
    }

    public function registerStudent(string $firstName, string $lastName, string $username, string $password, ?string $classCode): User
    {
        $classId = null;
        if (null !== $classCode && '' !== trim($classCode)) {
            $class = $this->classes->findByCode(trim($classCode));
            $classId = null !== $class ? $class->getId() : null;
        }

        return $this->users->insert(new RegistrationDetails(
            trim($firstName),
            trim($lastName),
            trim($username),
            null,
            password_hash($password, PASSWORD_DEFAULT),
            'student',
            $classId,
        ));
    }
}
