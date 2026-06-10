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
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\QuizProgress;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleProgress;
use Matheopolis\Domain\User;

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

    public function __construct(
        private readonly ClassroomRepositoryInterface $classes,
        private readonly UserRepositoryInterface $users,
        private readonly RiddleProgressRepositoryInterface $riddleProgress,
        private readonly ChapterProgressRepositoryInterface $chapterProgress,
        private readonly ChapterRepositoryInterface $chapters,
        private readonly RiddleRepositoryInterface $riddles,
        private readonly QuizRepositoryInterface $quizzes,
        private readonly QuizProgressRepositoryInterface $quizProgress,
        private readonly PasswordGenerator $passwordGenerator,
        private readonly ApiUserService $userService,
    ) {}

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
     *     startedRiddles: int,
     *     completedRiddles: int,
     *     completionRate: float,
     *     lastActivityAt: null|string
     * }>
     */
    public function classProgressSummary(int $classId): array
    {
        /** @var array<int, User> $students */
        $students = $this->users->findStudentsByClassId($classId);
        if ([] === $students) {
            return [];
        }
        $class = $this->classes->find($classId);

        $studentIds = array_map(static fn (User $user): int => $user->getId(), $students);
        $progressItems = $this->riddleProgress->findByUserIds($studentIds);

        /** @var array<int, array{started:int,completed:int,last:?string}> $stats */
        $stats = [];
        foreach ($students as $student) {
            $stats[$student->getId()] = ['started' => 0, 'completed' => 0, 'last' => null];
        }

        foreach ($progressItems as $item) {
            $studentId = $item->getUserId();
            if (!isset($stats[$studentId])) {
                continue;
            }
            ++$stats[$studentId]['started'];
            if ('completed' === $item->getStatus()) {
                ++$stats[$studentId]['completed'];
            }
            $candidate = $item->getCompletedAt() ?? $item->getStartedAt();
            if (null === $stats[$studentId]['last'] || $candidate > $stats[$studentId]['last']) {
                $stats[$studentId]['last'] = $candidate;
            }
        }

        $out = [];
        foreach ($students as $student) {
            $studentStat = $stats[$student->getId()];
            $started = $studentStat['started'];
            $completed = $studentStat['completed'];
            $out[] = [
                'user' => ApiMapper::user($student, $class),
                'startedRiddles' => $started,
                'completedRiddles' => $completed,
                'completionRate' => $started > 0 ? round(($completed / $started) * 100, 2) : 0.0,
                'lastActivityAt' => $studentStat['last'],
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
    ): array
    {
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

    private function formatProgressStatus(ChapterProgress|QuizProgress|RiddleProgress|null $progress): string
    {
        $status = null !== $progress ? $progress->getStatus() : 'not_started';

        return match ($status) {
            'completed' => 'Terminé',
            'in_progress' => 'En cours',
            default => 'Non commencé',
        };
    }

    private function formatScore(?int $score): string
    {
        return (string) ($score ?? 0);
    }

    private function formatQuizVisibility(Quiz $quiz): string
    {
        return 'public' === $quiz->getStatus() ? 'Public' : 'Privé';
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

    private function generateClassCode(): string
    {
        return 'CLS-'.strtoupper(bin2hex(random_bytes(4)));
    }
}
