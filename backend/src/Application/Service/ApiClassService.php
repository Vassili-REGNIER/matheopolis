<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\QuizProgressRepositoryInterface;
use Matheopolis\Application\Port\QuizRepositoryInterface;
use Matheopolis\Application\Port\RiddleProgressRepositoryInterface;
use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Application\Port\ScenarioRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\QuizProgress;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleProgress;
use Matheopolis\Domain\User;

/**
 * Coordinates API class application behavior.
 */
final class ApiClassService
{
    /** @var array<int, string> */
    private const LEVELS = [
        'grade_6',
        'grade_7',
        'grade_8',
        'grade_9',
        'grade_10',
        'grade_11',
        'grade_12',
    ];

    /**
     * Creates a new ApiClassService instance.
     */
    public function __construct(
        private readonly ClassroomRepositoryInterface $classes,
        private readonly UserRepositoryInterface $users,
        private readonly RiddleProgressRepositoryInterface $riddleProgress,
        private readonly ChapterProgressRepositoryInterface $chapterProgress,
        private readonly ChapterRepositoryInterface $chapters,
        private readonly RiddleRepositoryInterface $riddles,
        private readonly QuizRepositoryInterface $quizzes,
        private readonly QuizProgressRepositoryInterface $quizProgress,
        private readonly ChapterAccessResolver $chapterAccess,
        private readonly QuizAccessResolver $quizAccess,
        private readonly ScenarioRepositoryInterface $scenarios,
        private readonly PasswordGenerator $passwordGenerator,
        private readonly ApiUserService $userService,
    ) {}

    /**
     * Creates the requested resource.
     */
    public function create(string $name, ?string $description, string $level, int $teacherId): ClassEntity
    {
        $name = trim($name);
        if ('' === $name || mb_strlen($name) > 120) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid class name.');
        }

        $description = null !== $description ? trim($description) : null;
        if (null !== $description && mb_strlen($description) > 1000) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Class description is too long.');
        }

        $code = $this->generateClassCode();

        return $this->classes->insert($name, $description, $code, $teacherId, $this->normalizeLevel($level));
    }

    /**
     * Normalize level.
     */
    public function normalizeLevel(string $level): string
    {
        $level = trim($level);
        if (!\in_array($level, self::LEVELS, true)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid class level.');
        }

        return $level;
    }

    /**
     * @return array<int, ClassEntity>
     */
    public function listForTeacher(int $teacherId): array
    {
        return $this->classes->findByTeacher($teacherId);
    }

    /**
     * Assert class readable.
     */
    public function assertClassReadable(ClassEntity $class, User $actor): void
    {
        if ('admin' === $actor->getRole()) {
            return;
        }

        if ('teacher' === $actor->getRole() && $class->getTeacherId() === $actor->getId()) {
            return;
        }

        throw new ApiException(403, 'ACCESS_DENIED', 'Cannot access this class.');
    }

    /**
     * Assert class owned by teacher.
     */
    public function assertClassOwnedByTeacher(ClassEntity $class, User $actor): void
    {
        if ('admin' === $actor->getRole()) {
            return;
        }

        if ('teacher' === $actor->getRole() && $class->getTeacherId() === $actor->getId()) {
            return;
        }

        throw new ApiException(403, 'ACCESS_DENIED', 'Cannot manage this class.');
    }

    /**
     * @return array<int, User>
     */
    public function studentsForClass(int $classId): array
    {
        return $this->users->findStudentsByClassId($classId);
    }

    /**
     * @return list<array{
     *     user: array<string, mixed>,
     *     userId: int,
     *     startedChapters: int,
     *     completedChapters: int,
     *     totalChapters: int,
     *     startedQuizzes: int,
     *     completedQuizzes: int,
     *     totalQuizzes: int,
     *     startedItems: int,
     *     completedItems: int,
     *     totalItems: int,
     *     completionRate: float,
     *     lastActivityAt: null|string,
     *     chapterProgress: list<array<string, mixed>>,
     *     quizProgress: list<array<string, mixed>>
     * }>
     */
    public function classProgressSummary(int $classId): array
    {
        /** @var array<int, User> $students */
        $students = array_values($this->users->findStudentsByClassId($classId));
        if ([] === $students) {
            return [];
        }
        $class = $this->classes->find($classId);

        $studentIds = array_map(static fn (User $user): int => $user->getId(), $students);
        $accessibleChapters = $this->chapterAccess->listAccessible($students[0]);
        $accessibleQuizzes = $this->quizAccess->listAccessible($students[0]);
        $chapterIds = array_map(static fn (Chapter $chapter): int => $chapter->getId(), $accessibleChapters);
        $quizIds = array_map(static fn (Quiz $quiz): int => $quiz->getId(), $accessibleQuizzes);

        /** @var array<int, array<int, ChapterProgress>> $chapterProgressByStudent */
        $chapterProgressByStudent = [];
        if ([] !== $chapterIds) {
            foreach ($this->chapterProgress->findLatestByUserIds($studentIds) as $progress) {
                if (!\in_array($progress->getChapterId(), $chapterIds, true)) {
                    continue;
                }
                $chapterProgressByStudent[$progress->getUserId()][$progress->getChapterId()] = $progress;
            }
        }

        /** @var array<int, array<int, QuizProgress>> $quizProgressByStudent */
        $quizProgressByStudent = [];
        foreach ($this->quizProgress->findLatestByUserIdsAndQuizIds($studentIds, $quizIds) as $progress) {
            $quizProgressByStudent[$progress->getUserId()][$progress->getQuizId()] = $progress;
        }

        /** @var array<int, int> $stepCountsByChapter */
        $stepCountsByChapter = [];
        foreach ($accessibleChapters as $chapter) {
            $stepCountsByChapter[$chapter->getId()] = \count(
                $this->scenarios->buildPlayScenario($chapter->getId())['steps']
            );
        }

        /** @var array<int, int> $questionCountsByQuiz */
        $questionCountsByQuiz = [];
        foreach ($accessibleQuizzes as $quiz) {
            $questionCountsByQuiz[$quiz->getId()] = $this->quizzes->countQuestions($quiz->getId());
        }

        $out = [];
        foreach ($students as $student) {
            $studentId = $student->getId();
            $chapterDetails = [];
            $quizDetails = [];
            $percentages = [];
            $startedChapters = 0;
            $completedChapters = 0;
            $startedQuizzes = 0;
            $completedQuizzes = 0;
            $lastActivityAt = null;

            foreach ($accessibleChapters as $chapter) {
                $progress = $chapterProgressByStudent[$studentId][$chapter->getId()] ?? null;
                $stepCount = $stepCountsByChapter[$chapter->getId()] ?? 0;
                $percent = $this->chapterProgressPercent($progress, $stepCount);
                $percentages[] = $percent;
                if (null !== $progress) {
                    ++$startedChapters;
                    $lastActivityAt = $this->latestActivity(
                        $lastActivityAt,
                        $progress->getCompletedAt() ?? $progress->getStartedAt(),
                    );
                    if ('completed' === $progress->getStatus()) {
                        ++$completedChapters;
                    }
                }
                $chapterDetails[] = $this->studentChapterProgressDetail($chapter, $progress, $stepCount, $percent);
            }

            foreach ($accessibleQuizzes as $quiz) {
                $progress = $quizProgressByStudent[$studentId][$quiz->getId()] ?? null;
                $questionCount = $questionCountsByQuiz[$quiz->getId()] ?? 0;
                $percent = $this->quizProgressPercent($progress, $questionCount);
                $percentages[] = $percent;
                if (null !== $progress) {
                    ++$startedQuizzes;
                    $lastActivityAt = $this->latestActivity(
                        $lastActivityAt,
                        $progress->getCompletedAt() ?? $progress->getStartedAt(),
                    );
                    if ('completed' === $progress->getStatus()) {
                        ++$completedQuizzes;
                    }
                }
                $quizDetails[] = $this->studentQuizProgressDetail($quiz, $progress, $questionCount, $percent);
            }

            $totalChapters = \count($accessibleChapters);
            $totalQuizzes = \count($accessibleQuizzes);
            $startedItems = $startedChapters + $startedQuizzes;
            $completedItems = $completedChapters + $completedQuizzes;
            $totalItems = $totalChapters + $totalQuizzes;

            $out[] = [
                'user' => ApiMapper::user($student, $class),
                'userId' => $studentId,
                'startedChapters' => $startedChapters,
                'completedChapters' => $completedChapters,
                'totalChapters' => $totalChapters,
                'startedQuizzes' => $startedQuizzes,
                'completedQuizzes' => $completedQuizzes,
                'totalQuizzes' => $totalQuizzes,
                'startedItems' => $startedItems,
                'completedItems' => $completedItems,
                'totalItems' => $totalItems,
                'completionRate' => [] === $percentages
                    ? 0.0
                    : round(array_sum($percentages) / \count($percentages), 2),
                'lastActivityAt' => ApiDateFormatter::toIsoUtc($lastActivityAt),
                'chapterProgress' => $chapterDetails,
                'quizProgress' => $quizDetails,
            ];
        }

        return $out;
    }

    /**
     * @return array{content: string, filename: string}
     */
    public function exportProgressCsv(
        int $classId,
        string $mode = 'overview',
        ?int $chapterId = null,
        ?int $quizId = null,
    ): array {
        $class = $this->classes->find($classId);
        if (null === $class) {
            throw new ApiException(404, 'NOT_FOUND', 'Class not found.');
        }

        return match ($mode) {
            'chapter' => $this->exportChapterDetailCsv($class, $chapterId),
            'quiz' => $this->exportQuizCsv($class),
            'quiz_public_detail' => $this->exportQuizDetailCsv($class, $quizId, 'public'),
            'quiz_private_detail' => $this->exportQuizDetailCsv($class, $quizId, 'private'),
            default => $this->exportOverviewCsv($class),
        };
    }

    /**
     * @return array{content: string, filename: string}
     */
    public function importStudentsCsv(int $classId, string $csvContent): array
    {
        $rows = $this->parseImportCsv($csvContent);
        $outputRows = [['nom', 'prenom', 'identifiant', 'mots de passes']];

        foreach ($rows as $row) {
            $plainPassword = $this->passwordGenerator->generate();
            $user = $this->userService->createStudentForClass(
                $row['prenom'],
                $row['nom'],
                password_hash($plainPassword, PASSWORD_DEFAULT),
                $classId,
            );

            $outputRows[] = [
                $row['nom'],
                $row['prenom'],
                $user->getPseudo(),
                $plainPassword,
            ];
        }

        return [
            'content' => $this->buildCsv($outputRows),
            'filename' => \sprintf('class-%d-students-import.csv', $classId),
        ];
    }

    /**
     * Resets the requested state.
     */
    public function resetStudentPassword(int $classId, int $studentId): string
    {
        $student = $this->users->find($studentId);
        if (null === $student || 'student' !== $student->getRole() || $student->getClassId() !== $classId) {
            throw new ApiException(404, 'NOT_FOUND', 'Student not found in this class.');
        }

        $plainPassword = $this->passwordGenerator->generate();
        $this->users->resetPassword($studentId, password_hash($plainPassword, PASSWORD_DEFAULT));

        return $plainPassword;
    }

    /**
     * Deletes the requested resource.
     */
    public function deleteStudentAccount(int $classId, int $studentId): void
    {
        $student = $this->users->find($studentId);
        if (null === $student || 'student' !== $student->getRole() || $student->getClassId() !== $classId) {
            throw new ApiException(404, 'NOT_FOUND', 'Student not found in this class.');
        }

        $this->users->delete($studentId);
    }

    /**
     * @return list<array{nom: string, prenom: string}>
     */
    private function parseImportCsv(string $csvContent): array
    {
        $csvContent = trim($csvContent);
        if ('' === $csvContent) {
            throw new ApiException(422, 'INVALID_CSV_FORMAT', 'Invalid CSV format.');
        }

        $handle = fopen('php://temp', 'r+');
        if (false === $handle) {
            throw new \RuntimeException('Failed to open temporary stream for CSV import.');
        }

        fwrite($handle, $csvContent);
        rewind($handle);

        $header = fgetcsv($handle);
        if (!\is_array($header)) {
            fclose($handle);

            throw new ApiException(422, 'INVALID_CSV_FORMAT', 'Invalid CSV format.');
        }

        $normalizedHeader = array_map(static fn (mixed $value): string => mb_strtolower(trim((string) $value)), $header);
        $nomIndex = array_search('nom', $normalizedHeader, true);
        $prenomIndex = array_search('prenom', $normalizedHeader, true);
        if (false === $nomIndex || false === $prenomIndex) {
            fclose($handle);

            throw new ApiException(422, 'INVALID_CSV_FORMAT', 'Invalid CSV format.');
        }

        $rows = [];
        while (($line = fgetcsv($handle)) !== false) {
            $nom = trim($line[$nomIndex] ?? '');
            $prenom = trim($line[$prenomIndex] ?? '');
            if ('' === $nom || '' === $prenom) {
                fclose($handle);

                throw new ApiException(422, 'INVALID_CSV_FORMAT', 'Invalid CSV format.');
            }
            $rows[] = ['nom' => $nom, 'prenom' => $prenom];
        }

        fclose($handle);
        if ([] === $rows) {
            throw new ApiException(422, 'INVALID_CSV_FORMAT', 'Invalid CSV format.');
        }

        return $rows;
    }

    /**
     * @return array{content: string, filename: string}
     */
    private function exportOverviewCsv(ClassEntity $class): array
    {
        $classId = $class->getId();
        $students = $this->users->findStudentsByClassId($classId);
        $chapters = $this->chapters->findAll();
        $studentIds = array_map(static fn (User $student): int => $student->getId(), $students);

        /** @var array<int, array<int, ChapterProgress>> $progressByStudent */
        $progressByStudent = [];
        foreach ($this->chapterProgress->findLatestByUserIds($studentIds) as $progress) {
            $progressByStudent[$progress->getUserId()][$progress->getChapterId()] = $progress;
        }

        $header = ['Nom', 'Prénom', 'Pseudo'];
        foreach ($chapters as $chapter) {
            $header[] = 'Nom du chapitre';
            $header[] = 'Progression';
            $header[] = 'Meilleur score';
            $header[] = 'Score maximal faisable';
        }
        $header[] = 'Progression totale';

        $rows = [$header];
        foreach ($students as $student) {
            $completedCount = 0;
            $row = $this->studentIdentityRow($student);
            foreach ($chapters as $chapter) {
                $progress = $progressByStudent[$student->getId()][$chapter->getId()] ?? null;
                if (null !== $progress && 'completed' === $progress->getStatus()) {
                    ++$completedCount;
                }
                $row[] = $chapter->getTitle();
                $row[] = $this->formatProgressStatus($progress);
                $row[] = $this->formatScore(null !== $progress ? $progress->getScore() : null);
                $row[] = '100';
            }
            $row[] = \count($chapters) > 0
                ? (string) round(($completedCount / \count($chapters)) * 100, 2).'%'
                : '0%';
            $rows[] = $row;
        }

        return [
            'content' => $this->buildCsv($rows),
            'filename' => \sprintf('Chapitres-%s.csv', $this->filenamePart($class->getName())),
        ];
    }

    /**
     * @return array{content: string, filename: string}
     */
    private function exportChapterDetailCsv(ClassEntity $class, ?int $chapterId): array
    {
        if (null === $chapterId) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'chapterId is required for chapter export mode.');
        }

        $chapter = $this->chapters->find($chapterId);
        if (null === $chapter) {
            throw new ApiException(404, 'NOT_FOUND', 'Chapter not found.');
        }

        $classId = $class->getId();
        $students = $this->users->findStudentsByClassId($classId);
        $studentIds = array_map(static fn (User $student): int => $student->getId(), $students);
        $riddles = $this->riddles->findChallengeByChapterId($chapterId);
        $riddleIds = array_map(static fn (Riddle $riddle): int => $riddle->getId(), $riddles);

        /** @var array<int, array<int, RiddleProgress>> $riddleProgressByStudent */
        $riddleProgressByStudent = [];
        foreach ($this->riddleProgress->findLatestByUserIdsAndRiddleIds($studentIds, $riddleIds) as $progress) {
            $riddleProgressByStudent[$progress->getUserId()][$progress->getRiddleId()] = $progress;
        }

        $bestScores = $this->riddleProgress->findBestScoresByUserIdsAndRiddleIds($studentIds, $riddleIds);

        $header = ['Nom', 'Prénom', 'Pseudo'];
        foreach ($riddles as $riddle) {
            $header[] = 'Nom de l\'énigme';
            $header[] = 'Progression';
            $header[] = 'Meilleur score';
            $header[] = 'Score maximal faisable';
            $header[] = 'Nombre de tentatives';
        }

        $rows = [$header];
        foreach ($students as $student) {
            $row = $this->studentIdentityRow($student);

            foreach ($riddles as $riddle) {
                $riddleProgress = $riddleProgressByStudent[$student->getId()][$riddle->getId()] ?? null;
                $row[] = $riddle->getTitle();
                $row[] = $this->formatProgressStatus($riddleProgress);
                $row[] = $this->formatScore($bestScores[$student->getId()][$riddle->getId()] ?? null);
                $row[] = '100';
                $row[] = (string) (null !== $riddleProgress ? $riddleProgress->getAttemptCount() : 0);
            }

            $rows[] = $row;
        }

        return [
            'content' => $this->buildCsv($rows),
            'filename' => \sprintf(
                'Detail-Chapitre-%s-%s.csv',
                $this->filenamePart($class->getName()),
                $this->filenamePart($chapter->getTitle()),
            ),
        ];
    }

    /**
     * @return array{content: string, filename: string}
     */
    private function exportQuizCsv(ClassEntity $class): array
    {
        $classId = $class->getId();
        $students = $this->users->findStudentsByClassId($classId);
        $quizzes = $this->quizzes->findAll();
        $studentIds = array_map(static fn (User $student): int => $student->getId(), $students);
        $quizIds = array_map(static fn (Quiz $quiz): int => $quiz->getId(), $quizzes);
        $questionCounts = [];
        foreach ($quizzes as $quiz) {
            $questionCounts[$quiz->getId()] = $this->quizzes->countQuestions($quiz->getId());
        }

        /** @var array<int, array<int, QuizProgress>> $progressByStudent */
        $progressByStudent = [];
        foreach ($this->quizProgress->findLatestByUserIdsAndQuizIds($studentIds, $quizIds) as $progress) {
            $progressByStudent[$progress->getUserId()][$progress->getQuizId()] = $progress;
        }

        $bestScores = $this->quizProgress->findBestScoresByUserIdsAndQuizIds($studentIds, $quizIds);
        $attemptCounts = $this->quizProgress->findAttemptCountsByUserIdsAndQuizIds($studentIds, $quizIds);

        $header = ['Nom', 'Prénom', 'Pseudo'];
        foreach ($quizzes as $quiz) {
            $header[] = 'Nom du quiz';
            $header[] = 'Visibilité';
            $header[] = 'Progression';
            $header[] = 'Meilleure tentative';
            $header[] = 'Nombre de questions';
            $header[] = 'Nombre de tentatives';
        }

        $rows = [$header];
        foreach ($students as $student) {
            $row = $this->studentIdentityRow($student);
            foreach ($quizzes as $quiz) {
                $quizProgress = $progressByStudent[$student->getId()][$quiz->getId()] ?? null;
                $row[] = $quiz->getTitle();
                $row[] = $this->formatQuizVisibility($quiz);
                $row[] = $this->formatProgressStatus($quizProgress);
                $row[] = $this->formatScore($bestScores[$student->getId()][$quiz->getId()] ?? null);
                $row[] = (string) ($questionCounts[$quiz->getId()] ?? 0);
                $row[] = (string) ($attemptCounts[$student->getId()][$quiz->getId()] ?? 0);
            }
            $rows[] = $row;
        }

        return [
            'content' => $this->buildCsv($rows),
            'filename' => \sprintf('Quiz-%s.csv', $this->filenamePart($class->getName())),
        ];
    }

    /**
     * @return array{content: string, filename: string}
     */
    private function exportQuizDetailCsv(ClassEntity $class, ?int $quizId, string $expectedStatus): array
    {
        if (null === $quizId) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'quizId is required for quiz detail export mode.');
        }

        $quiz = $this->quizzes->find($quizId);
        if (null === $quiz || $quiz->getStatus() !== $expectedStatus) {
            throw new ApiException(404, 'NOT_FOUND', 'Quiz not found.');
        }

        if ('private' === $expectedStatus && $quiz->getCreatorId() !== $class->getTeacherId()) {
            throw new ApiException(403, 'ACCESS_DENIED', 'Cannot export this private quiz.');
        }

        $students = $this->users->findStudentsByClassId($class->getId());
        $studentIds = array_map(static fn (User $student): int => $student->getId(), $students);
        $questionCount = $this->quizzes->countQuestions($quiz->getId());

        /** @var array<int, QuizProgress> $latestProgressByStudent */
        $latestProgressByStudent = [];
        foreach ($this->quizProgress->findLatestByUserIdsAndQuizIds($studentIds, [$quiz->getId()]) as $progress) {
            $latestProgressByStudent[$progress->getUserId()] = $progress;
        }

        $bestProgressByStudent = $this->quizProgress->findBestProgressByUserIdsAndQuizId($studentIds, $quiz->getId());

        $header = [
            'Nom',
            'Prénom',
            'Pseudo',
            'Progression',
            'Meilleure tentative',
            'Nombre de questions',
            'Nombre de tentatives',
        ];

        $rows = [$header];
        foreach ($students as $student) {
            $studentId = $student->getId();
            $latestProgress = $latestProgressByStudent[$studentId] ?? null;
            $bestProgress = $bestProgressByStudent[$studentId] ?? null;

            $row = [
                ...$this->studentIdentityRow($student),
                $this->formatProgressStatus($latestProgress),
                $this->formatScore(null !== $bestProgress ? $bestProgress->getScore() : null),
                (string) $questionCount,
                (string) (null !== $latestProgress ? $latestProgress->getAttemptCount() : 0),
            ];

            $rows[] = $row;
        }

        $visibilityPart = 'public' === $expectedStatus ? 'Public' : 'Prive';

        return [
            'content' => $this->buildCsv($rows),
            'filename' => \sprintf(
                'Detail-Quiz-%s-%s-%s.csv',
                $visibilityPart,
                $this->filenamePart($class->getName()),
                $this->filenamePart($quiz->getTitle()),
            ),
        ];
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    private function studentIdentityRow(User $student): array
    {
        return [$student->getLastname(), $student->getFirstname(), $student->getPseudo()];
    }

    /**
     * Format progress status.
     */
    private function formatProgressStatus(ChapterProgress|QuizProgress|RiddleProgress|null $progress): string
    {
        $status = null !== $progress ? $progress->getStatus() : 'not_started';

        return match ($status) {
            'completed' => 'Terminé',
            'in_progress' => 'En cours',
            default => 'Non commencé',
        };
    }

    /**
     * Format score.
     */
    private function formatScore(?int $score): string
    {
        return (string) ($score ?? 0);
    }

    /**
     * Format quiz visibility.
     */
    private function formatQuizVisibility(Quiz $quiz): string
    {
        return 'public' === $quiz->getStatus() ? 'Public' : 'Privé';
    }

    /**
     * @return array<string, mixed>
     */
    private function studentChapterProgressDetail(
        Chapter $chapter,
        ?ChapterProgress $progress,
        int $stepCount,
        int $percent,
    ): array {
        return [
            'chapterId' => $chapter->getId(),
            'title' => $chapter->getTitle(),
            'status' => null !== $progress ? $progress->getStatus() : 'not_started',
            'percent' => $percent,
            'currentStepIndex' => null !== $progress ? $progress->getCurrentStepIndex() : 0,
            'stepCount' => $stepCount,
            'score' => null !== $progress ? $progress->getScore() : null,
            'startedAt' => ApiDateFormatter::toIsoUtc(null !== $progress ? $progress->getStartedAt() : null),
            'completedAt' => ApiDateFormatter::toIsoUtc(null !== $progress ? $progress->getCompletedAt() : null),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function studentQuizProgressDetail(
        Quiz $quiz,
        ?QuizProgress $progress,
        int $questionCount,
        int $percent,
    ): array {
        return [
            'quizId' => $quiz->getId(),
            'title' => $quiz->getTitle(),
            'visibility' => $quiz->getStatus(),
            'status' => null !== $progress ? $progress->getStatus() : 'not_started',
            'percent' => $percent,
            'currentQuestionIndex' => null !== $progress ? $progress->getCurrentQuestionIndex() : 0,
            'questionCount' => $questionCount,
            'score' => null !== $progress ? $progress->getScore() : null,
            'attemptCount' => null !== $progress ? $progress->getAttemptCount() : 0,
            'startedAt' => ApiDateFormatter::toIsoUtc(null !== $progress ? $progress->getStartedAt() : null),
            'completedAt' => ApiDateFormatter::toIsoUtc(null !== $progress ? $progress->getCompletedAt() : null),
        ];
    }

    /**
     * Chapter progress percent.
     */
    private function chapterProgressPercent(?ChapterProgress $progress, int $stepCount): int
    {
        if (null === $progress || 'not_started' === $progress->getStatus()) {
            return 0;
        }
        if ('completed' === $progress->getStatus()) {
            return 100;
        }
        if ($stepCount <= 0) {
            return 0;
        }

        $percent = (int) round(($progress->getCurrentStepIndex() / $stepCount) * 100);

        return max(0, min(99, $percent));
    }

    /**
     * Quiz progress percent.
     */
    private function quizProgressPercent(?QuizProgress $progress, int $questionCount): int
    {
        if (null === $progress || 'not_started' === $progress->getStatus()) {
            return 0;
        }
        if ('completed' === $progress->getStatus()) {
            return 100;
        }
        if ($questionCount <= 0) {
            return 0;
        }

        $percent = (int) round(($progress->getCurrentQuestionIndex() / $questionCount) * 100);

        return max(0, min(99, $percent));
    }

    /**
     * Latest activity.
     */
    private function latestActivity(?string $current, ?string $candidate): ?string
    {
        if (null === $candidate) {
            return $current;
        }
        if (null === $current || $candidate > $current) {
            return $candidate;
        }

        return $current;
    }

    /**
     * @param array<int, array<int, string>> $rows
     */
    private function buildCsv(array $rows): string
    {
        $handle = fopen('php://temp', 'r+');
        if (false === $handle) {
            throw new \RuntimeException('Failed to open temporary stream for CSV export.');
        }

        foreach ($rows as $row) {
            fputcsv($handle, $row, ';');
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);
        if (!\is_string($content)) {
            throw new \RuntimeException('Failed to build CSV export.');
        }

        return "\xEF\xBB\xBF".$content;
    }

    /**
     * Filename part.
     */
    private function filenamePart(string $value): string
    {
        $normalized = trim($value);
        if (\function_exists('iconv')) {
            $transliterated = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $normalized);
            if (false !== $transliterated && '' !== trim($transliterated)) {
                $normalized = $transliterated;
            }
        }

        $normalized = preg_replace('/[^A-Za-z0-9]+/', '-', $normalized) ?? '';
        $normalized = trim($normalized, '-');

        return '' !== $normalized ? $normalized : 'export';
    }

    /**
     * Generate class code.
     */
    private function generateClassCode(): string
    {
        return 'CLS-'.strtoupper(bin2hex(random_bytes(4)));
    }
}
