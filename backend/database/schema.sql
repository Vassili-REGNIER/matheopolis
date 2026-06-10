-- ==============================================================================
-- Matheopolis - Initial Database Schema
-- Architecture constraint: MySQL, Native PHP, strict schema with foreign keys.
-- ==============================================================================

SET NAMES 'utf8mb4';
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `username` VARCHAR(32) NOT NULL UNIQUE,
    `email` VARCHAR(255) UNIQUE NULL,
    `email_verified_at` DATETIME NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'teacher', 'student', 'free_user') NOT NULL,
    `class_id` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `last_active` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. CLASSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `classes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `level` VARCHAR(50) NOT NULL,
    `teacher_id` INT NOT NULL,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `archived_at` DATETIME NULL,
    CONSTRAINT `fk_classes_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users`
ADD CONSTRAINT `fk_users_class` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 3. CHAPTERS TABLE
-- Narrative chapter metadata. Ordered scenario steps live in chapter_steps.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chapters` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `statement` TEXT NULL,
    `position` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. CHAPTER STEPS TABLE
-- Ordered scenario for a chapter. Each row is one info, dialogue, or riddle step.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chapter_steps` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `chapter_id` INT NOT NULL,
    `order_index` INT NOT NULL,
    `type` ENUM('info', 'dialogue', 'riddle') NOT NULL,
    UNIQUE KEY `uk_chapter_step_order` (`chapter_id`, `order_index`),
    CONSTRAINT `fk_chapter_step_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. STEP INFO TABLE
-- Content for chapter_steps where type = 'info'.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `step_infos` (
    `step_id` INT PRIMARY KEY,
    `content` JSON NOT NULL,
    `theme` VARCHAR(120) NOT NULL DEFAULT 'default',
    CONSTRAINT `fk_step_info_step` FOREIGN KEY (`step_id`) REFERENCES `chapter_steps`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. STEP DIALOGUE TABLE
-- Shell for chapter_steps where type = 'dialogue'. Lines are in dialogue_lines.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `step_dialogues` (
    `step_id` INT PRIMARY KEY,
    `theme` VARCHAR(120) NOT NULL DEFAULT 'default',
    CONSTRAINT `fk_step_dialogue_step` FOREIGN KEY (`step_id`) REFERENCES `chapter_steps`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. DIALOGUE LINES TABLE
-- Ordered lines inside a dialogue step.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `dialogue_lines` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `step_id` INT NOT NULL,
    `order_index` INT NOT NULL,
    `text` TEXT NOT NULL,
    `speaker_id` VARCHAR(64) NULL,
    `emotion` ENUM('neutral', 'happy', 'sad', 'surprised', 'thinking', 'angry') NULL DEFAULT 'neutral',
    `position` ENUM('left', 'right') NULL,
    UNIQUE KEY `uk_dialogue_line_order` (`step_id`, `order_index`),
    CONSTRAINT `fk_dialogue_line_step` FOREIGN KEY (`step_id`) REFERENCES `step_dialogues`(`step_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. RIDDLES TABLE
-- Content for chapter_steps where type = 'riddle'. game_id maps to frontend GamesRegistry.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `riddles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `step_id` INT NOT NULL UNIQUE,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `game_id` VARCHAR(64) NOT NULL,
    `mode` ENUM('practice', 'challenge') NOT NULL DEFAULT 'challenge',
    `title` VARCHAR(255) NOT NULL,
    `instruction` TEXT NOT NULL,
    `intro_text` TEXT NULL,
    `completion_message` TEXT NOT NULL,
    `game_params` JSON NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL,
    CONSTRAINT `fk_riddle_step` FOREIGN KEY (`step_id`) REFERENCES `chapter_steps`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. CHAPTER TARGET CLASSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chapter_target_classes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `chapter_id` INT NOT NULL,
    `class_id` INT NOT NULL,
    `is_active` BOOLEAN NOT NULL,
    UNIQUE KEY `uk_chapter_class` (`chapter_id`, `class_id`),
    CONSTRAINT `fk_chapter_target_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_chapter_target_class` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. CHAPTER PROGRESSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chapter_progressions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `chapter_id` INT NOT NULL,
    `status` ENUM('in_progress', 'completed') NOT NULL DEFAULT 'in_progress',
    `current_step_index` INT NOT NULL DEFAULT 0,
    `attempt_count` INT NOT NULL DEFAULT 0,
    `score` INT NULL,
    `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `completed_at` DATETIME NULL,
    UNIQUE KEY `uk_user_chapter_attempt` (`user_id`, `chapter_id`, `attempt_count`),
    CONSTRAINT `fk_chapter_progression_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_chapter_progression_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. RIDDLE QUESTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `riddle_questions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `riddle_id` INT NOT NULL,
    `order_index` INT NOT NULL,
    `prompt` TEXT NOT NULL,
    `answer` VARCHAR(512) NOT NULL,
    `hint` TEXT NULL,
    `difficulty` INT NOT NULL DEFAULT 1,
    `metadata` JSON NULL,
    UNIQUE KEY `uk_riddle_question_order` (`riddle_id`, `order_index`),
    CONSTRAINT `fk_riddle_question_riddle` FOREIGN KEY (`riddle_id`) REFERENCES `riddles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. QUIZZES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quizzes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `creator_id` INT NOT NULL,
    `status` ENUM('private', 'public') NOT NULL DEFAULT 'private',
    `ask_admin` BOOLEAN NOT NULL DEFAULT FALSE,
    `position` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL,
    CONSTRAINT `fk_quizzes_creator` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. QUIZ QUESTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_questions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `quiz_id` INT NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `order_index` INT NOT NULL,
    `type` ENUM('select', 'checkbox', 'radio') NOT NULL,
    CONSTRAINT `fk_quiz_question_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. QUIZ OPTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_options` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `question_id` INT NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `is_correct` BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT `fk_quiz_option_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. QUIZ TARGET CLASSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_target_classes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `quiz_id` INT NOT NULL,
    `class_id` INT NOT NULL,
    `is_active` BOOLEAN NOT NULL,
    UNIQUE KEY `uk_quiz_class` (`quiz_id`, `class_id`),
    CONSTRAINT `fk_quiz_target_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quiz_target_class` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 16. QUIZ PROGRESSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_progressions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `quiz_id` INT NOT NULL,
    `status` ENUM('in_progress', 'completed') NOT NULL DEFAULT 'in_progress',
    `attempt_count` INT NOT NULL DEFAULT 1,
    `current_question_index` INT NOT NULL DEFAULT 0,
    `score` INT NULL,
    `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `completed_at` DATETIME NULL,
    UNIQUE KEY `uk_user_quiz_attempt` (`user_id`, `quiz_id`, `attempt_count`),
    CONSTRAINT `fk_quiz_progression_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quiz_progression_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 17. QUIZ RESPONSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_responses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `progression_id` INT NOT NULL,
    `question_id` INT NOT NULL,
    `option_id` INT NOT NULL,
    `attempt_number` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_quiz_responses_attempt` (`progression_id`, `attempt_number`),
    CONSTRAINT `fk_quiz_response_progression` FOREIGN KEY (`progression_id`) REFERENCES `quiz_progressions`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quiz_response_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quiz_response_option` FOREIGN KEY (`option_id`) REFERENCES `quiz_options`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 18. AUTH TOKENS TABLE
-- One-time tokens for email verification and password reset.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auth_tokens` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `type` ENUM('email_verification', 'password_reset') NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_auth_token_hash` (`token_hash`),
    KEY `idx_auth_token_user_type` (`user_id`, `type`),
    CONSTRAINT `fk_auth_token_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
