<?php
declare(strict_types=1);

namespace Src\Repository;

use Core\Repository;
use Src\Domain\UserProgress;

class UserProgressRepository extends Repository
{
    protected function getTableName(): string
    {
        return 'user_progress';
    }

    protected function mapToEntity(array $row): UserProgress
    {
        return new UserProgress(
            (int)$row['user_id'],
            (int)$row['chapter_id'],
            $row['status'],
            isset($row['score']) ? (int)$row['score'] : null,
            $row['completed_at'] ?? null
        );
    }

    /**
     * Récupère la progression d'un user sur un chapitre précis.
     */
    public function findProgress(int $userId, int $chapterId): ?UserProgress
    {
        $query = "SELECT * FROM user_progress WHERE user_id = :uid AND chapter_id = :cid LIMIT 1";
        $stmt = $this->db->execute($query, ['uid' => $userId, 'cid' => $chapterId]);
        $row = $stmt->fetch();

        return $row ? $this->mapToEntity($row) : null;
    }

    /**
     * Sauvegarde ou met à jour la progression (Upsert).
     */
    public function saveProgress(int $userId, int $chapterId, string $status, ?int $score = null): bool
    {
        // Syntaxe MySQL spécifique "ON DUPLICATE KEY UPDATE"
        $query = "INSERT INTO user_progress (user_id, chapter_id, status, score, completed_at) 
                  VALUES (:uid, :cid, :status, :score, NOW()) 
                  ON DUPLICATE KEY UPDATE 
                  status = :status_up, 
                  score = :score_up, 
                  completed_at = NOW()";

        $this->db->execute($query, [
            'uid'       => $userId,
            'cid'       => $chapterId,
            'status'    => $status,
            'score'     => $score,
            'status_up' => $status,
            'score_up'  => $score
        ]);

        return true;
    }

    /**
     * Récupère la progression globale avec les titres des chapitres (Pour le Dashboard).
     * @return array Retourne un tableau brut (car c'est une jointure complexe, pas juste une Entité)
     */
    public function getGlobalProgressWithDetails(int $userId): array
    {
        $query = "SELECT p.*, c.title, c.slug, c.order_index 
                  FROM user_progress p
                  JOIN chapters c ON p.chapter_id = c.id
                  WHERE p.user_id = :uid
                  ORDER BY c.order_index ASC";

        $stmt = $this->db->execute($query, ['uid' => $userId]);

        // Ici, on retourne le tableau associatif direct car ça contient des données mixées (UserProgress + Chapter info)
        return $stmt->fetchAll();
    }
}