<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\Puzzle;
use Matheopolis\Domain\PuzzleProgress;
use Matheopolis\Domain\User;

final class ApiMapper
{
    /**
     * @return array<string, mixed>
     */
    public static function user(User $user): array
    {
        return [
            'id' => $user->getId(),
            'firstName' => $user->getFirstname(),
            'lastName' => $user->getLastname(),
            'username' => $user->getPseudo(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
            'classId' => $user->getClassId(),
            'createdAt' => $user->getCreatedAt(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function classEntity(ClassEntity $class): array
    {
        return [
            'id' => $class->getId(),
            'name' => $class->getName(),
            'description' => $class->getDescription(),
            'code' => $class->getCode(),
            'teacherId' => $class->getTeacherId(),
            'createdAt' => $class->getCreatedAt(),
            'archivedAt' => $class->getArchivedAt(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function puzzle(Puzzle $puzzle): array
    {
        return [
            'id' => $puzzle->getId(),
            'slug' => $puzzle->getSlug(),
            'title' => $puzzle->getTitle(),
            'statement' => $puzzle->getStatement(),
            'position' => $puzzle->getPosition(),
            'isActive' => $puzzle->isActive(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function progress(PuzzleProgress $progress): array
    {
        return [
            'id' => $progress->getId(),
            'studentId' => $progress->getStudentId(),
            'riddleId' => $progress->getPuzzleId(),
            'status' => $progress->getStatus(),
            'attemptCount' => $progress->getAttemptCount(),
            'startedAt' => $progress->getStartedAt(),
            'completedAt' => $progress->getCompletedAt(),
            'lastAttemptAt' => $progress->getLastAttemptAt(),
        ];
    }
}
