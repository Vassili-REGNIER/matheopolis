<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\RiddleProgressRepositoryInterface;
use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Application\Port\ScenarioRepositoryInterface;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\User;

final class ApiChapterService
{
    public function __construct(
        private readonly ChapterRepositoryInterface $chapters,
        private readonly ChapterProgressRepositoryInterface $chapterProgress,
        private readonly RiddleRepositoryInterface $riddles,
        private readonly RiddleProgressRepositoryInterface $riddleProgress,
        private readonly ChapterAccessResolver $access,
        private readonly ScenarioRepositoryInterface $scenarios,
    ) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(?User $actor): array
    {
        $items = [];
        foreach ($this->access->listAccessible($actor) as $chapter) {
            $scenario = $this->scenarios->buildPlayScenario($chapter->getId());
            $items[] = ApiMapper::chapterSummary(
                $chapter,
                $this->progressOrNull($actor, $chapter),
                \count($scenario['steps']),
            );
        }

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    public function show(?User $actor, int $chapterId): array
    {
        $chapter = $this->requireAccessibleChapter($actor, $chapterId);

        return ApiMapper::chapterDetail(
            $chapter,
            $this->scenarios->buildPlayScenario($chapter->getId()),
            $this->progressOrNull($actor, $chapter),
        );
    }

    public function start(User $actor, int $chapterId): ChapterProgress
    {
        $chapter = $this->requireAccessibleChapter($actor, $chapterId);

        return $this->chapterProgress->start($actor->getId(), $chapter->getId());
    }

    public function syncStep(User $actor, int $chapterId, int $currentStepIndex): ChapterProgress
    {
        $chapter = $this->requireAccessibleChapter($actor, $chapterId);
        $progress = $this->chapterProgress->findByUserAndChapter($actor->getId(), $chapter->getId());
        if (null === $progress || 'in_progress' !== $progress->getStatus()) {
            throw new ApiException(409, 'CHAPTER_NOT_IN_PROGRESS', 'Chapter not in progress.');
        }
        if ($currentStepIndex < 0) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'currentStepIndex must be zero or positive.');
        }

        $stepCount = \count($this->scenarios->buildPlayScenario($chapter->getId())['steps']);
        if ($currentStepIndex >= $stepCount) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'currentStepIndex is out of range.');
        }

        return $this->chapterProgress->syncStepIndex($actor->getId(), $chapter->getId(), $currentStepIndex);
    }

    /**
     * @return array<string, mixed>
     */
    public function getProgress(User $actor, int $chapterId): array
    {
        $this->requireAccessibleChapter($actor, $chapterId);
        $progress = $this->chapterProgress->findByUserAndChapter($actor->getId(), $chapterId);
        if (null === $progress) {
            return ApiMapper::virtualChapterProgress($actor->getId(), $chapterId);
        }

        return ApiMapper::chapterProgress($progress);
    }

    public function complete(User $actor, int $chapterId, ?int $score = null): ChapterProgress
    {
        if (null !== $score && ($score < 0 || $score > 100)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'score must be between 0 and 100.');
        }

        $chapter = $this->requireAccessibleChapter($actor, $chapterId);
        $existing = $this->chapterProgress->findByUserAndChapter($actor->getId(), $chapter->getId());
        if (null === $existing) {
            throw new ApiException(409, 'CHAPTER_NOT_IN_PROGRESS', 'Chapter not in progress.');
        }
        if ('completed' === $existing->getStatus()) {
            if (null !== $score) {
                return $this->chapterProgress->complete($actor->getId(), $chapter->getId(), $score);
            }

            throw new ApiException(409, 'CHAPTER_ALREADY_COMPLETED', 'Chapter already completed.');
        }

        foreach ($this->riddles->findChallengeByChapterId($chapter->getId()) as $challenge) {
            $riddleProgress = $this->riddleProgress->findByUserAndRiddle($actor->getId(), $challenge->getId());
            if (null === $riddleProgress || 'completed' !== $riddleProgress->getStatus()) {
                throw new ApiException(409, 'CHAPTER_NOT_READY', 'Not all challenge riddles are completed.');
            }
        }

        return $this->chapterProgress->complete($actor->getId(), $chapter->getId(), $score);
    }

    /**
     * @return array<int, array{classId: int, isActive: bool}>
     */
    public function listTargetClasses(User $actor, int $chapterId): array
    {
        $this->requireChapter($chapterId);

        if ('admin' === $actor->getRole()) {
            return $this->chapters->findTargetClassesByChapterId($chapterId, null);
        }

        if ('teacher' === $actor->getRole()) {
            return $this->chapters->findTargetClassesByChapterId($chapterId, $actor->getId());
        }

        throw new ApiException(403, 'ACCESS_DENIED', 'Cannot list target classes for this chapter.');
    }

    public function setTargetClass(User $actor, int $chapterId, int $classId, bool $isActive): void
    {
        $chapter = $this->requireChapter($chapterId);
        if ($isActive) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Chapter access is public by default; use DELETE to remove a restriction.');
        }

        if (!$this->access->canSetTargetClass($actor, $chapter, $classId, $isActive)) {
            throw new ApiException(403, 'ACCESS_DENIED', 'Cannot set target class for this chapter.');
        }

        $this->chapters->upsertTargetClass($chapterId, $classId, $isActive);
    }

    public function removeTargetClass(User $actor, int $chapterId, int $classId): void
    {
        $this->requireChapter($chapterId);
        if (!$this->access->canRemoveTargetClass($actor, $classId)) {
            throw new ApiException(403, 'ACCESS_DENIED', 'Cannot remove target class for this chapter.');
        }

        $this->chapters->deleteTargetClass($chapterId, $classId);
    }

    private function requireChapter(int $chapterId): Chapter
    {
        $chapter = $this->chapters->find($chapterId);
        if (null === $chapter) {
            throw new ApiException(404, 'NOT_FOUND', 'Chapter not found.');
        }

        return $chapter;
    }

    private function requireAccessibleChapter(?User $actor, int $chapterId): Chapter
    {
        $chapter = $this->requireChapter($chapterId);
        if (!$this->access->canAccess($actor, $chapter)) {
            throw new ApiException(404, 'NOT_FOUND', 'Chapter not found.');
        }

        return $chapter;
    }

    /**
     * @return null|array<string, mixed>
     */
    private function progressOrNull(?User $actor, Chapter $chapter): ?array
    {
        if (null === $actor) {
            return null;
        }

        $progress = $this->chapterProgress->findByUserAndChapter($actor->getId(), $chapter->getId());
        if (null === $progress) {
            return null;
        }

        return ApiMapper::chapterProgress($progress);
    }
}
