CREATE TABLE IF NOT EXISTS classes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT NULL,
    code VARCHAR(40) NOT NULL UNIQUE,
    teacher_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_at DATETIME NULL,
    INDEX idx_classes_teacher_id (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(120) NOT NULL,
    lastname VARCHAR(120) NOT NULL,
    pseudo VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(190) NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student',
    class_id INT UNSIGNED NULL,
    remember_token VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    CONSTRAINT fk_users_class_id FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    INDEX idx_users_role (role),
    INDEX idx_users_class_id (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE classes
    ADD CONSTRAINT fk_classes_teacher_id
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS teacher_codes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    status ENUM('active', 'used', 'disabled') NOT NULL DEFAULT 'active',
    used_by_user_id INT UNSIGNED NULL,
    used_at DATETIME NULL,
    expires_at DATETIME NULL,
    created_by_admin_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_teacher_codes_user_id FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_teacher_codes_admin_id FOREIGN KEY (created_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_teacher_codes_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS puzzles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    statement TEXT NOT NULL,
    position INT UNSIGNED NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    UNIQUE KEY uq_puzzles_position (position),
    INDEX idx_puzzles_active_position (is_active, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS puzzle_hints (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    puzzle_id INT UNSIGNED NOT NULL,
    hint_text TEXT NOT NULL,
    rank INT UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_puzzle_hints_puzzle_id FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_puzzle_hints_rank (puzzle_id, rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS puzzle_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    puzzle_id INT UNSIGNED NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
    attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
    started_at DATETIME NULL,
    last_attempt_at DATETIME NULL,
    completed_at DATETIME NULL,
    play_token_hash CHAR(64) NULL,
    token_nonce VARCHAR(64) NULL,
    token_expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    CONSTRAINT fk_puzzle_progress_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_puzzle_progress_puzzle FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_student_puzzle_progress (student_id, puzzle_id),
    INDEX idx_progress_student_status (student_id, status),
    INDEX idx_progress_puzzle (puzzle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    limiter_key VARCHAR(190) NOT NULL,
    window_started_at DATETIME NOT NULL,
    attempts INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    UNIQUE KEY uq_rate_limits_key_window (limiter_key, window_started_at),
    INDEX idx_rate_limits_key (limiter_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
