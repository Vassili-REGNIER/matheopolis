-- ==============================================================================
-- Matheopolis - Initial Database Schema
-- Architecture constraint: MySQL, Native PHP, strict schema with foreign keys.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- Handles admin, teacher, student, and free_user roles.
-- Note: Email domain validation for teachers is handled at the Application layer.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `username` VARCHAR(32) NOT NULL UNIQUE, -- Constraint: 3 to 32 chars enforced in backend
    `email` VARCHAR(255) UNIQUE NULL,       -- Nullable for students/free users without emails
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'teacher', 'student', 'free_user') NOT NULL,
    `class_id` INT NULL,                    -- A student belongs to exactly one class
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `last_active` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. CLASSES TABLE
-- A teacher can manage multiple classes. 
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `classes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `level` VARCHAR(50) NOT NULL,           -- e.g., 'grade_6', 'grade_7'
    `teacher_id` INT NOT NULL,              -- Owner of the class
    `code` VARCHAR(50) UNIQUE NOT NULL,     -- Code for student self-registration
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `archived_at` DATETIME NULL,
    CONSTRAINT `fk_classes_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add the foreign key for the user's class now that classes table exists
ALTER TABLE `users` 
ADD CONSTRAINT `fk_users_class` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 3. CHAPTERS TABLE
-- Metadata for chapters.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chapters` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `statement` TEXT NULL,
    `position` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. CHAPTER PROGRESSIONS TABLE
-- Server-owned state for student progression on chapters.
-- ------------------------------------------------------------------------------
-- A row exists only once a student has started the chapter, so there is no 'not_started'
-- status and `started_at` is mandatory. The "not started" state is the absence of a row.
CREATE TABLE IF NOT EXISTS `chapter_progressions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `chapter_id` INT NOT NULL,
    `status` ENUM('in_progress', 'completed') NOT NULL DEFAULT 'in_progress',
    `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `completed_at` DATETIME NULL,
    UNIQUE KEY `uk_student_chapter` (`student_id`, `chapter_id`),
    CONSTRAINT `fk_chapter_progression_student` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_chapter_progression_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. CHAPTER TARGET CLASSES TABLE
-- Many-to-many relationship between chapters and classes. 
-- Teachers can deactivate a chapter for a class by adding an entry between them.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chapter_target_classes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `chapter_id` INT NOT NULL,
    `class_id` INT NOT NULL,
    CONSTRAINT `fk_chapter_target_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_chapter_target_class` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. RIDDLES TABLE
-- Chapters contain explanations, dialogues, and mini-games riddles.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `riddles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `chapter_id` INT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `statement` TEXT NOT NULL,
    `position` INT NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_riddles_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. RIDDLE PROGRESSIONS TABLE
-- Server-owned state for student progression on riddles.
-- A row exists only once a student has started the riddle, so there is no 'not_started'
-- status and `started_at` is mandatory. The "not started" state is the absence of a row.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `riddle_progressions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `riddle_id` INT NOT NULL,
    `status` ENUM('in_progress', 'completed') NOT NULL DEFAULT 'in_progress',
    `attempt_count` INT NOT NULL DEFAULT 0,
    `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `hint_at` DATETIME NULL,
    `completed_at` DATETIME NULL,
    `last_attempt_at` DATETIME NULL,
    `play_token_hash` VARCHAR(255) NULL,
    `token_nonce` VARCHAR(64) NULL,
    `token_expires_at` DATETIME NULL,
    UNIQUE KEY `uk_student_riddle` (`student_id`, `riddle_id`), -- A student has 1 progression per riddle
    CONSTRAINT `fk_riddle_progression_student` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_riddle_progression_riddle` FOREIGN KEY (`riddle_id`) REFERENCES `riddles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. USED NONCES TABLE (ANTI-CHEAT / PLAY TOKENS)
-- Stores nonces from decoded playTokens to strictly prevent replay attacks.
-- Scheduled tasks or events can purge expired rows.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `used_nonces` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nonce` VARCHAR(64) NOT NULL,
    `user_id` INT NOT NULL,
    `riddle_id` INT NOT NULL,
    `is_expired` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_used_nonces_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_used_nonces_riddle` FOREIGN KEY (`riddle_id`) REFERENCES `riddles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. QUIZZES TABLE
-- A quiz is a database-backed chapter type authored by teachers/admins.
-- Quizzes can be 'private' (no one by default) or 'public' (everyone by default).
-- Teachers set `ask_admin` to request publication; only admins can set status='public'.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quizzes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `creator_id` INT NOT NULL,
    `status` ENUM('private', 'public') NOT NULL DEFAULT 'private',
    `ask_admin` BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE when a teacher requests publication
    `position` INT NOT NULL DEFAULT 0,          -- Ordering when merged into the GameHome chapter list
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL,
    CONSTRAINT `fk_quizzes_creator` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. QUIZ QUESTIONS TABLE
-- Stores questions for quizzes. Each question belongs to one quiz.
-- Questions are choice-based only (no free-text 'input' type).
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
-- 10. QUIZ OPTIONS TABLE
-- Stores options for select/checkbox/radio questions. Each option belongs to one question.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_options` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `question_id` INT NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `is_correct` BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT `fk_quiz_option_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. QUIZ TARGET CLASSES TABLE
-- Per-class visibility overrides for a (quiz, class) pair.
-- is_active = TRUE grants a private quiz to a class; is_active = FALSE restricts a public quiz for a class.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_target_classes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `quiz_id` INT NOT NULL,
    `class_id` INT NOT NULL,
    `is_active` BOOLEAN NOT NULL,
    UNIQUE KEY `uk_quiz_class` (`quiz_id`, `class_id`), -- One override per (quiz, class)
    CONSTRAINT `fk_quiz_target_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quiz_target_class` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. QUIZ PROGRESSIONS TABLE
-- Server-owned per-(student, quiz) progression. Tracks attempts and the current question.
-- A row exists only once a student has started the quiz, so there is no 'not_started'
-- status and `started_at` is mandatory. The "not started" state is the absence of a row.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_progressions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `quiz_id` INT NOT NULL,
    `status` ENUM('in_progress', 'completed') NOT NULL DEFAULT 'in_progress',
    `attempt_count` INT NOT NULL DEFAULT 1,
    `current_question_index` INT NOT NULL DEFAULT 0, -- Index of the question the student is currently on
    `last_score` INT NULL,                           -- Score of the most recent completed attempt
    `best_score` INT NULL,                           -- Best score across attempts
    `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `completed_at` DATETIME NULL,
    UNIQUE KEY `uk_student_quiz` (`student_id`, `quiz_id`), -- A student has 1 progression per quiz
    CONSTRAINT `fk_quiz_progression_student` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quiz_progression_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. QUIZ RESPONSES TABLE
-- One row per selected option, scoped to a progression, attempt, and question.
-- A 'checkbox' answer produces several rows for the same (attempt, question).
-- Keeping attempt_number preserves the full answer history across multiple attempts.
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

SET FOREIGN_KEY_CHECKS = 1;