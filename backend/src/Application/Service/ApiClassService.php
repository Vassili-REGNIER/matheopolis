<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\RiddleProgressRepositoryInterface;
use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\ClassEntity;
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
                'user' => ApiMapper::user($student),
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
    public function exportProgressCsv(int $classId, string $mode = 'overview', ?int $chapterId = null): array
    {
        return match ($mode) {
            'chapter' => $this->exportChapterDetailCsv($classId, $chapterId),
            default => $this->exportOverviewCsv($classId),
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
    private function exportOverviewCsv(int $classId): array
    {
        $students = $this->users->findStudentsByClassId($classId);
        $chapters = $this->chapters->findAll();
        $studentIds = array_map(static fn (User $student): int => $student->getId(), $students);

        /** @var array<int, array<int, ChapterProgress>> $progressByStudent */
        $progressByStudent = [];
        foreach ($this->chapterProgress->findLatestByUserIds($studentIds) as $progress) {
            $progressByStudent[$progress->getUserId()][$progress->getChapterId()] = $progress;
        }

        $header = ['nom', 'prenom', 'identifiant'];
        foreach ($chapters as $chapter) {
            $header[] = 'chapitre:'.$chapter->getTitle();
        }
        $header[] = 'progression_totale';

        $rows = [$header];
        foreach ($students as $student) {
            $completedCount = 0;
            $row = [$student->getLastname(), $student->getFirstname(), $student->getPseudo()];
            foreach ($chapters as $chapter) {
                $progress = $progressByStudent[$student->getId()][$chapter->getId()] ?? null;
                if (null !== $progress && 'completed' === $progress->getStatus()) {
                    ++$completedCount;
                }
                $row[] = null !== $progress ? $progress->getStatus() : 'not_started';
            }
            $row[] = \count($chapters) > 0
                ? (string) round(($completedCount / \count($chapters)) * 100, 2).'%'
                : '0%';
            $rows[] = $row;
        }

        return [
            'content' => $this->buildCsv($rows),
            'filename' => \sprintf('class-%d-progress-overview.csv', $classId),
        ];
    }

    /**
     * @return array{content: string, filename: string}
     */
    private function exportChapterDetailCsv(int $classId, ?int $chapterId): array
    {
        if (null === $chapterId) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'chapterId is required for chapter export mode.');
        }

        $chapter = $this->chapters->find($chapterId);
        if (null === $chapter) {
            throw new ApiException(404, 'NOT_FOUND', 'Chapter not found.');
        }

        $students = $this->users->findStudentsByClassId($classId);
        $studentIds = array_map(static fn (User $student): int => $student->getId(), $students);
        $riddles = $this->riddles->findByChapterId($chapterId);
        $riddleIds = array_map(static fn (Riddle $riddle): int => $riddle->getId(), $riddles);

        /** @var array<int, ChapterProgress> $chapterProgressByStudent */
        $chapterProgressByStudent = [];
        foreach ($this->chapterProgress->findLatestByUserIds($studentIds) as $progress) {
            if ($progress->getChapterId() === $chapterId) {
                $chapterProgressByStudent[$progress->getUserId()] = $progress;
            }
        }

        /** @var array<int, array<int, RiddleProgress>> $riddleProgressByStudent */
        $riddleProgressByStudent = [];
        foreach ($this->riddleProgress->findLatestByUserIdsAndRiddleIds($studentIds, $riddleIds) as $progress) {
            $riddleProgressByStudent[$progress->getUserId()][$progress->getRiddleId()] = $progress;
        }

        $header = [
            'nom',
            'prenom',
            'identifiant',
            'chapitre_statut',
            'chapitre_tentative',
            'chapitre_score',
            'chapitre_etape_courante',
        ];
        foreach ($riddles as $riddle) {
            $header[] = 'enigme:'.$riddle->getTitle().':statut';
            $header[] = 'enigme:'.$riddle->getTitle().':tentatives';
            $header[] = 'enigme:'.$riddle->getTitle().':score';
        }

        $rows = [$header];
        foreach ($students as $student) {
            $chapterProgress = $chapterProgressByStudent[$student->getId()] ?? null;
            $row = [
                $student->getLastname(),
                $student->getFirstname(),
                $student->getPseudo(),
                null !== $chapterProgress ? $chapterProgress->getStatus() : 'not_started',
                null !== $chapterProgress ? (string) $chapterProgress->getAttemptCount() : '0',
                null !== $chapterProgress && null !== $chapterProgress->getScore() ? (string) $chapterProgress->getScore() : '',
                null !== $chapterProgress ? (string) $chapterProgress->getCurrentStepIndex() : '0',
            ];

            foreach ($riddles as $riddle) {
                $riddleProgress = $riddleProgressByStudent[$student->getId()][$riddle->getId()] ?? null;
                $row[] = null !== $riddleProgress ? $riddleProgress->getStatus() : 'not_started';
                $row[] = null !== $riddleProgress ? (string) $riddleProgress->getAttemptCount() : '0';
                $row[] = null !== $riddleProgress && null !== $riddleProgress->getScore() ? (string) $riddleProgress->getScore() : '';
            }

            $rows[] = $row;
        }

        return [
            'content' => $this->buildCsv($rows),
            'filename' => \sprintf('class-%d-chapter-%d-progress.csv', $classId, $chapterId),
        ];
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
            fputcsv($handle, $row);
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);
        if (!\is_string($content)) {
            throw new \RuntimeException('Failed to build CSV export.');
        }

        return $content;
    }

    private function generateClassCode(): string
    {
        return 'CLS-'.strtoupper(bin2hex(random_bytes(4)));
    }
}
