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
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
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
DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `level` VARCHAR(50) NOT NULL,           -- e.g., 'grade_6', 'grade_7'
    `teacher_id` INT NOT NULL,              -- Owner of the class
    `code` VARCHAR(50) UNIQUE NOT NULL,     -- Code for student self-registration
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_classes_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add the foreign key for the user's class now that classes table exists
ALTER TABLE `users` 
ADD CONSTRAINT `fk_users_class` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 3. CHAPTERS TABLE
-- Metadata for chapters (useful for the 100-question MCQ chapter, etc.)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `chapters`;
CREATE TABLE `chapters` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `position` INT NOT NULL DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. RIDDLES TABLE
-- Chapters contain explanations, dialogues, and mini-games riddles.
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `riddles`;
CREATE TABLE `riddles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `chapter_id` INT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `statement` TEXT NOT NULL,
    `position` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_riddles_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. RIDDLE PROGRESSIONS TABLE
-- Server-owned state for student progression on riddles.
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `riddle_progressions`;
CREATE TABLE `riddle_progressions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `riddle_id` INT NOT NULL,
    `status` ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    `attempt_count` INT DEFAULT 0,
    `started_at` DATETIME NULL,
    `hint_at` DATETIME NULL,
    `completed_at` DATETIME NULL,
    `last_attempt_at` DATETIME NULL,
    UNIQUE KEY `uk_student_riddle` (`student_id`, `riddle_id`), -- A student has 1 progression per riddle
    CONSTRAINT `fk_progression_student` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_progression_riddle` FOREIGN KEY (`riddle_id`) REFERENCES `riddles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. USED NONCES TABLE (ANTI-CHEAT / PLAY TOKENS)
-- Stores nonces from decoded playTokens to strictly prevent replay attacks.
-- Scheduled tasks or events can purge expired rows.
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `used_nonces`;
CREATE TABLE `used_nonces` (
    `nonce` VARCHAR(64) PRIMARY KEY,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. QUIZZES TABLE
-- For the quiz management feature. Quizzes can be private (teacher-only) or public.
-- Teachers can optionally require admin approval for public quizzes.
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `quizzes`;
CREATE TABLE `quizzes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `teacher_id` INT,
    `status` ENUM('private', 'public') DEFAULT 'private',
    `ask_admin` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. QUIZ QUESTIONS TABLE
-- Stores questions for quizzes. Each question belongs to one quiz.
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `quiz_questions`;
CREATE TABLE `quiz_questions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `quiz_id` INT NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `order_index` INT NOT NULL,
    `type` ENUM('input', 'select', 'checkbox', 'radio') NOT NULL,
    CONSTRAINT `fk_quiz_question_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. QUIZ OPTIONS TABLE
-- Stores options for select/checkbox/radio questions. Each option belongs to one question.
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `quiz_options`;
CREATE TABLE `quiz_options` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `question_id` INT NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `is_correct` BOOLEAN DEFAULT FALSE,
    CONSTRAINT `fk_quiz_option_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. QUIZ TARGET CLASSES TABLE
-- Many-to-many relationship between quizzes and classes. A quiz can target multiple classes, and a class can have multiple quizzes.
-- ------------------------------------------------------------------------------
CREATE TABLE `quiz_target_classes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `quiz_id` INT NOT NULL,
    `class_id` INT NOT NULL,
    CONSTRAINT `fk_quiz_target_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quiz_target_class` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;