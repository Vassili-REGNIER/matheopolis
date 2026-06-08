-- ==============================================================================
-- Matheopolis - Clear demo data only (preserves production content)
--
-- Keeps: chapters, scenario steps, riddles, quiz Laurence (by title).
-- Removes: demo users, classes, demo quizzes, and all related progressions.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM quizzes
WHERE title IN (
    'Fractions warm-up',
    'Advanced algebra',
    'Class 6A checkpoint',
    'Secret review'
);

DELETE FROM users
WHERE username IN (
    'admin',
    'theo.teacher',
    'felix.demo',
    'sam.student1',
    'lia.student2',
    'marc.student1'
);

SET FOREIGN_KEY_CHECKS = 1;
