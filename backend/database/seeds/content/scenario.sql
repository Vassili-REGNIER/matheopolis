-- ==============================================================================
-- Matheopolis - Scenarios
-- Generated from TypeScript scenario configs
-- ==============================================================================

SET NAMES 'utf8mb4';
SET FOREIGN_KEY_CHECKS = 0;

-- Clean up existing data to avoid duplicates if re-run
DELETE FROM `chapter_progressions`;
DELETE FROM `riddle_progressions`;
DELETE FROM `chapters` WHERE `slug` IN ('base-conversion', 'piano-fractions');

-- ------------------------------------------------------------------------------
-- 1. CHAPTERS
-- ------------------------------------------------------------------------------
INSERT INTO `chapters` (`id`, `slug`, `title`, `statement`, `position`, `created_at`) VALUES
(1, 'base-conversion', 'La date du rendez-vous', 'Déchiffrez les messages secrets de votre père.', 1, CURRENT_TIMESTAMP),
(2, 'piano-fractions', 'Le piano de Pythagore', 'L''harmonie des nombres et de la musique.', 2, CURRENT_TIMESTAMP);

SET FOREIGN_KEY_CHECKS = 1;
