<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Application\Port\ScenarioRepositoryInterface;
use Matheopolis\Application\Service\ScenarioBuilder;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;
use Matheopolis\Infrastructure\Persistence\Database\Queryable;

final class ScenarioRepository extends AbstractRepository implements ScenarioRepositoryInterface
{
    public function __construct(
        Queryable $db,
        private readonly RiddleRepositoryInterface $riddles,
        private readonly ScenarioBuilder $builder,
    ) {
        parent::__construct($db);
    }

    /**
     * @return array{steps: array<int, array<string, mixed>>}
     */
    public function buildPlayScenario(int $chapterId): array
    {
        $stmt = $this->db->execute(
            'SELECT id, order_index, type FROM chapter_steps WHERE chapter_id = :chapter_id ORDER BY order_index ASC, id ASC',
            ['chapter_id' => $chapterId],
        );

        $steps = [];
        foreach ($stmt->fetchAll() as $row) {
            $stepId = $this->rowInt($row, 'id');
            $type = $this->rowStr($row, 'type');

            $built = match ($type) {
                'info' => null !== ($info = $this->loadInfo($stepId)) ? $this->builder->infoStep($info) : null,
                'dialogue' => null !== ($dialogue = $this->loadDialogue($stepId)) ? $this->builder->dialogueStep($dialogue) : null,
                'riddle' => $this->loadRiddleStep($stepId),
                default => null,
            };

            if (null !== $built) {
                $steps[] = $built;
            }
        }

        return ['steps' => $steps];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function loadInfo(int $stepId): ?array
    {
        $stmt = $this->db->execute('SELECT * FROM step_infos WHERE step_id = :step_id LIMIT 1', ['step_id' => $stepId]);
        $row = $stmt->fetch();

        return false !== $row ? $row : null;
    }

    /**
     * @return array{dialogue: array<string, mixed>, lines: array<int, array<string, mixed>>}|null
     */
    private function loadDialogue(int $stepId): ?array
    {
        $stmt = $this->db->execute('SELECT * FROM step_dialogues WHERE step_id = :step_id LIMIT 1', ['step_id' => $stepId]);
        $dialogue = $stmt->fetch();
        if (false === $dialogue) {
            return null;
        }

        $linesStmt = $this->db->execute(
            'SELECT * FROM dialogue_lines WHERE step_id = :step_id ORDER BY order_index ASC, id ASC',
            ['step_id' => $stepId],
        );
        $lines = [];
        foreach ($linesStmt->fetchAll() as $line) {
            $lines[] = $line;
        }

        return ['dialogue' => $dialogue, 'lines' => $lines];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function loadRiddleStep(int $stepId): ?array
    {
        $stmt = $this->db->execute(
            'SELECT r.id FROM riddles r WHERE r.step_id = :step_id LIMIT 1',
            ['step_id' => $stepId],
        );
        $row = $stmt->fetch();
        if (false === $row) {
            return null;
        }

        $riddle = $this->riddles->find($this->rowInt($row, 'id'));
        if (null === $riddle) {
            return null;
        }

        return $this->builder->riddleStepForPlay($riddle);
    }

    protected function getTableName(): string
    {
        return 'chapter_steps';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): object
    {
        return (object) $row;
    }
}
