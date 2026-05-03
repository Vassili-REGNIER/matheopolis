<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\CryptoInterface;
use Matheopolis\Application\Port\TeacherCodeRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\Exception\AuthException;
use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Domain\User;

final class UserRegistrationService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly ClassroomRepositoryInterface $classes,
        private readonly TeacherCodeRepositoryInterface $teacherCodes,
        private readonly CryptoInterface $crypto,
    ) {}

    public function registerStandard(
        string $firstname,
        string $lastname,
        string $pseudo,
        string $password,
        string $email,
    ): User {
        $details = $this->buildDetails($firstname, $lastname, $pseudo, $password, 'standard', $email, null);

        return $this->persistNewUser($details);
    }

    public function registerTeacher(
        string $firstname,
        string $lastname,
        string $pseudo,
        string $password,
        string $email,
        string $teacherInvitationCode,
    ): User {
        $code = $this->teacherCodes->findByCode($teacherInvitationCode);
        if (null === $code) {
            throw new AuthException('Code enseignant invalide.');
        }
        if ($code->isUsed()) {
            throw new AuthException('Ce code enseignant a déjà été utilisé.');
        }

        $details = $this->buildDetails($firstname, $lastname, $pseudo, $password, 'teacher', $email, null);
        $user = $this->persistNewUser($details);
        $this->teacherCodes->markAsUsed($code->getId(), $user->getId());

        return $user;
    }

    public function registerStudent(
        string $firstname,
        string $lastname,
        string $pseudo,
        string $password,
        string $classCode,
    ): User {
        $class = $this->classes->findByCode($classCode);
        if (null === $class) {
            throw new AuthException('Code classe introuvable.');
        }

        $details = $this->buildDetails($firstname, $lastname, $pseudo, $password, 'student', null, $class->getId());

        return $this->persistNewUser($details);
    }

    private function buildDetails(
        string $firstname,
        string $lastname,
        string $pseudo,
        string $plainPassword,
        string $role,
        ?string $email,
        ?int $classId,
    ): RegistrationDetails {
        $hashed = $this->crypto->hashPassword($plainPassword);

        return new RegistrationDetails(
            firstname: $firstname,
            lastname: $lastname,
            pseudo: $pseudo,
            hashedPassword: $hashed,
            role: $role,
            email: $email,
            classId: $classId,
        );
    }

    private function persistNewUser(RegistrationDetails $details): User
    {
        if (null !== $this->users->findByLogin($details->pseudo)) {
            throw new AuthException("Le pseudo '{$details->pseudo}' est déjà utilisé.");
        }

        if (null !== $details->email && '' !== $details->email) {
            if (null !== $this->users->findByLogin($details->email)) {
                throw new AuthException("L'email '{$details->email}' est déjà associé à un compte.");
            }
        }

        return $this->users->insert($details);
    }
}
