<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\ScenarioRepositoryInterface;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\User;

final class ApiChapterService
{
    public function __construct(
        private readonly ChapterRepositoryInterface $chapters,
        private readonly ChapterProgressRepositoryInterface $chapterProgress,
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
            $items[] = ApiMapper::chapterSummary($chapter, $this->progressOrNull($actor, $chapter));
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
        $existing = $this->chapterProgress->findByUserAndChapter($actor->getId(), $chapter->getId());
        if (null !== $existing && 'completed' === $existing->getStatus()) {
            throw new ApiException(409, 'CHAPTER_ALREADY_COMPLETED', 'Chapter already completed.');
        }

        return $this->chapterProgress->start($actor->getId(), $chapter->getId());
    }

    public function updateProgress(User $actor, int $chapterId, int $currentStepIndex, ?int $score): ChapterProgress
    {
        $chapter = $this->requireAccessibleChapter($actor, $chapterId);
        if ($currentStepIndex < 0) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'currentStepIndex must be greater than or equal to 0.');
        }

        $progress = $this->chapterProgress->start($actor->getId(), $chapter->getId());
        if ('completed' === $progress->getStatus()) {
            throw new ApiException(409, 'CHAPTER_ALREADY_COMPLETED', 'Chapter already completed.');
        }

        $lastStepIndex = $this->lastScenarioStepIndex($chapter->getId());
        if ($currentStepIndex > $lastStepIndex) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'currentStepIndex is outside this chapter scenario.');
        }

        $previousStepIndex = $progress->getCurrentStepIndex();
        if ($currentStepIndex < $previousStepIndex) {
            return $progress;
        }
        if ($currentStepIndex > $previousStepIndex + 1) {
            throw new ApiException(409, 'CHAPTER_STEP_OUT_OF_SEQUENCE', 'Chapter progress can only advance one step at a time.');
        }

        return $this->chapterProgress->advanceToStep($actor->getId(), $chapter->getId(), $currentStepIndex, $score);
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

    public function complete(User $actor, int $chapterId): ChapterProgress
    {
        $chapter = $this->requireAccessibleChapter($actor, $chapterId);
        $existing = $this->chapterProgress->findByUserAndChapter($actor->getId(), $chapter->getId());
        if (null === $existing) {
            throw new ApiException(409, 'CHAPTER_NOT_IN_PROGRESS', 'Chapter not in progress.');
        }
        if ('completed' === $existing->getStatus()) {
            throw new ApiException(409, 'CHAPTER_ALREADY_COMPLETED', 'Chapter already completed.');
        }

        if ($existing->getCurrentStepIndex() < $this->lastScenarioStepIndex($chapter->getId())) {
            throw new ApiException(409, 'CHAPTER_NOT_READY', 'Chapter scenario is not completed.');
        }

        return $this->chapterProgress->complete($actor->getId(), $chapter->getId());
    }

    private function requireAccessibleChapter(?User $actor, int $chapterId): Chapter
    {
        $chapter = $this->chapters->find($chapterId);
        if (null === $chapter || !$this->access->canAccess($actor, $chapter)) {
            throw new ApiException(404, 'NOT_FOUND', 'Chapter not found.');
        }

        return $chapter;
    }

    private function lastScenarioStepIndex(int $chapterId): int
    {
        $scenario = $this->scenarios->buildPlayScenario($chapterId);

        return max(0, \count($scenario['steps']) - 1);
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
