-- ==============================================================================
-- Matheopolis - Scenarios
-- Generated from TypeScript scenario configs
-- ==============================================================================

SET NAMES 'utf8mb4';
SET FOREIGN_KEY_CHECKS = 0;

-- Clean up existing data to avoid duplicates if re-run
DELETE FROM `chapter_progressions`;
DELETE FROM `riddle_responses`;
DELETE FROM `riddle_progressions`;
DELETE FROM `riddle_questions`;
DELETE FROM `riddles`;
DELETE FROM `dialogue_lines`;
DELETE FROM `step_dialogues`;
DELETE FROM `step_infos`;
DELETE FROM `chapter_target_classes`;
DELETE FROM `chapter_steps`;
DELETE FROM `chapters` WHERE `slug` IN ('base-conversion', 'piano-fractions');

-- ------------------------------------------------------------------------------
-- 1. CHAPTERS
-- ------------------------------------------------------------------------------
INSERT INTO `chapters` (`id`, `slug`, `title`, `statement`, `position`, `created_at`) VALUES
(1, 'base-conversion', 'Conversions de base', 'Déchiffrez les messages secrets de votre père.', 1, CURRENT_TIMESTAMP),
(2, 'piano-fractions', 'Les maths et la musique', 'L''harmonie des nombres et de la musique.', 2, CURRENT_TIMESTAMP);

SET FOREIGN_KEY_CHECKS = 1;
