<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleQuestion;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

/**
 * Persists and retrieves riddle records.
 */
final class RiddleRepository extends AbstractRepository implements RiddleRepositoryInterface
{
    private const RIDDLE_SELECT = 'SELECT r.*, cs.chapter_id AS chapter_id FROM riddles r
        INNER JOIN chapter_steps cs ON cs.id = r.step_id';

    /**
     * Finds matching records for the requested criteria.
     */
    public function find(int $id): ?Riddle
    {
        $stmt = $this->db->execute(self::RIDDLE_SELECT.' WHERE r.id = :id LIMIT 1', ['id' => $id]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapRiddle($row) : null;
    }

    /**
     * @return array<int, Riddle>
     */
    public function findByChapterId(int $chapterId): array
    {
        $stmt = $this->db->execute(
            self::RIDDLE_SELECT.' WHERE cs.chapter_id = :chapter_id
             ORDER BY cs.order_index ASC, r.id ASC',
            ['chapter_id' => $chapterId],
        );
        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = $this->mapRiddle($row);
        }

        return $items;
    }

    /**
     * @return array<int, Riddle>
     */
    public function findChallengeByChapterId(int $chapterId): array
    {
        $stmt = $this->db->execute(
            self::RIDDLE_SELECT.' WHERE cs.chapter_id = :chapter_id AND r.mode = :mode
             ORDER BY cs.order_index ASC',
            ['chapter_id' => $chapterId, 'mode' => 'challenge'],
        );
        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = $this->mapRiddle($row);
        }

        return $items;
    }

    /**
     * Finds matching records for the requested criteria.
     */
    public function findChapterIdByRiddleId(int $riddleId): ?int
    {
        $riddle = $this->find($riddleId);

        return null !== $riddle ? $riddle->getChapterId() : null;
    }

    /**
     * @return array<int, RiddleQuestion>
     */
    public function findQuestionsByRiddleId(int $riddleId): array
    {
        $stmt = $this->db->execute(
            'SELECT * FROM riddle_questions WHERE riddle_id = :riddle_id ORDER BY order_index ASC, id ASC',
            ['riddle_id' => $riddleId],
        );
        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = $this->mapQuestion($row);
        }

        return $items;
    }

    /**
     * Finds matching records for the requested criteria.
     */
    public function findQuestion(int $questionId): ?RiddleQuestion
    {
        $stmt = $this->db->execute('SELECT * FROM riddle_questions WHERE id = :id LIMIT 1', ['id' => $questionId]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapQuestion($row) : null;
    }

    /**
     * Finds matching records for the requested criteria.
     */
    public function findQuestionByRiddleAndIndex(int $riddleId, int $orderIndex): ?RiddleQuestion
    {
        $stmt = $this->db->execute(
            'SELECT * FROM riddle_questions WHERE riddle_id = :riddle_id AND order_index = :order_index LIMIT 1',
            ['riddle_id' => $riddleId, 'order_index' => $orderIndex],
        );
        $row = $stmt->fetch();

        return null !== $row ? $this->mapQuestion($row) : null;
    }

    /**
     * Returns the table name.
     */
    protected function getTableName(): string
    {
        return 'riddles';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): object
    {
        return $this->mapRiddle($row);
    }

    /**
     * @param array<string, mixed> $row
     */
    private function mapRiddle(array $row): Riddle
    {
        $gameParams = $row['game_params'] ?? null;
        $gameParamsJson = null;
        if (null !== $gameParams && '' !== $gameParams) {
            $gameParamsJson = \is_string($gameParams) ? $gameParams : json_encode($gameParams, JSON_THROW_ON_ERROR);
        }

        return new Riddle(
            $this->rowInt($row, 'id'),
            $this->rowInt($row, 'step_id'),
            $this->rowInt($row, 'chapter_id'),
            $this->rowStr($row, 'slug'),
            $this->rowStr($row, 'game_id'),
            $this->rowStr($row, 'mode', 'challenge'),
            $this->rowStr($row, 'title'),
            $this->rowStr($row, 'instruction'),
            $this->rowStrOrNull($row, 'intro_text'),
            $this->rowStr($row, 'completion_message'),
            $gameParamsJson,
        );
    }

    /**
     * @param array<string, mixed> $row
     */
    private function mapQuestion(array $row): RiddleQuestion
    {
        $metadata = $row['metadata'] ?? null;
        $metadataJson = null;
        if (null !== $metadata && '' !== $metadata) {
            $metadataJson = \is_string($metadata) ? $metadata : json_encode($metadata, JSON_THROW_ON_ERROR);
        }

        return new RiddleQuestion(
            $this->rowInt($row, 'id'),
            $this->rowInt($row, 'riddle_id'),
            $this->rowInt($row, 'order_index'),
            $this->rowStr($row, 'prompt'),
            $this->rowStr($row, 'answer'),
            $this->rowStrOrNull($row, 'hint'),
            $this->rowInt($row, 'difficulty', 1),
            $metadataJson,
        );
    }
}
