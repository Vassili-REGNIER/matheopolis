CREATE TABLE IF NOT EXISTS puzzle_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    puzzle_id INT UNSIGNED NOT NULL,
    is_solved TINYINT(1) NOT NULL DEFAULT 0,
    hint_unlocked TINYINT(1) NOT NULL DEFAULT 0,
    solved_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    CONSTRAINT fk_puzzle_progress_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_puzzle_progress_puzzle FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_student_puzzle_progress (student_id, puzzle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
