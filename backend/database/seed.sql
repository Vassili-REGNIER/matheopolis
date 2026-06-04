-- ==============================================================================
-- Matheopolis - Development seed data
-- Loaded after schema.sql on first MySQL container start (see infra/docker-compose.dev.yml).
--
-- Demo password for every account below: password
-- Hash: bcrypt of "password" (local development only).
-- ==============================================================================

SET @demo_password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

-- ------------------------------------------------------------------------------
-- Users (one account per role)
-- ------------------------------------------------------------------------------
INSERT INTO users (first_name, last_name, username, email, password_hash, role, class_id, created_at)
VALUES
    ('Ada', 'Admin', 'admin', 'admin@matheopolis.local', @demo_password_hash, 'admin', NULL, '2026-01-10 09:00:00'),
    ('Theo', 'Teacher', 'theo.teacher', 'theo.teacher@ac-lyon.fr', @demo_password_hash, 'teacher', NULL, '2026-01-10 09:05:00'),
    ('Felix', 'Demo', 'felix.demo', 'felix.demo@gmail.com', @demo_password_hash, 'free_user', NULL, '2026-01-10 09:10:00');

SET @teacher_id = (SELECT id FROM users WHERE username = 'theo.teacher' LIMIT 1);

-- ------------------------------------------------------------------------------
-- Classes (owned by Theo)
-- ------------------------------------------------------------------------------
INSERT INTO classes (name, description, level, code, teacher_id, created_at)
VALUES
    ('Class 6A', 'Main pilot class for grade 6', 'grade_6', 'CLS-6A01', @teacher_id, '2026-01-11 08:00:00'),
    ('Class 7B', 'Secondary class for grade 7', 'grade_7', 'CLS-7B01', @teacher_id, '2026-01-11 08:05:00');

SET @class_6a_id = (SELECT id FROM classes WHERE code = 'CLS-6A01' LIMIT 1);
SET @class_7b_id = (SELECT id FROM classes WHERE code = 'CLS-7B01' LIMIT 1);

INSERT INTO users (first_name, last_name, username, email, password_hash, role, class_id, created_at)
VALUES
    ('Sam', 'Student', 'sam.student1', NULL, @demo_password_hash, 'student', @class_6a_id, '2026-01-12 10:00:00'),
    ('Lia', 'Student', 'lia.student2', NULL, @demo_password_hash, 'student', @class_6a_id, '2026-01-12 10:05:00'),
    ('Marc', 'Student', 'marc.student1', NULL, @demo_password_hash, 'student', @class_7b_id, '2026-01-12 10:10:00');

SET @student_sam_id = (SELECT id FROM users WHERE username = 'sam.student1' LIMIT 1);
SET @student_lia_id = (SELECT id FROM users WHERE username = 'lia.student2' LIMIT 1);
SET @admin_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);

-- ------------------------------------------------------------------------------
-- Chapters (metadata; narrative content lives in the frontend)
-- ------------------------------------------------------------------------------
INSERT INTO chapters (slug, title, statement, position, created_at)
VALUES
    ('piano-fractions', 'Fractions musicales', 'La lecon de piano de Pythagore.', 1, '2026-01-15 09:00:00'),
    ('base-conversion', 'Conversion de base', 'Passez d''une base a l''autre.', 2, '2026-01-15 09:05:00'),
    ('thales-ratio', 'Theoreme de Thales', 'Triangles et proportionnalite.', 3, '2026-01-15 09:10:00');

SET @chapter_piano_id = (SELECT id FROM chapters WHERE slug = 'piano-fractions' LIMIT 1);
SET @chapter_base_id = (SELECT id FROM chapters WHERE slug = 'base-conversion' LIMIT 1);
SET @chapter_thales_id = (SELECT id FROM chapters WHERE slug = 'thales-ratio' LIMIT 1);

-- ------------------------------------------------------------------------------
-- Riddles (mini-games; answers validated in ApiRiddleService by riddle id)
-- id 1 => 16 | id 2 => 8 | id 3 => 80
-- ------------------------------------------------------------------------------
INSERT INTO riddles (chapter_id, slug, title, statement, position, is_active, created_at)
VALUES
    (@chapter_piano_id, 'enigme-1', 'Enigme 1', 'Find the missing number in the sequence: 2, 4, 8, ?', 1, TRUE, '2026-01-15 10:00:00'),
    (@chapter_base_id, 'enigme-2', 'Enigme 2', 'Solve: if x + 7 = 15 then x = ?', 2, TRUE, '2026-01-15 10:05:00'),
    (@chapter_thales_id, 'enigme-3', 'Enigme 3', 'A triangle has angles 40 and 60 degrees. What is the third angle?', 3, TRUE, '2026-01-15 10:10:00');

SET @riddle_1_id = (SELECT id FROM riddles WHERE slug = 'enigme-1' LIMIT 1);
SET @riddle_2_id = (SELECT id FROM riddles WHERE slug = 'enigme-2' LIMIT 1);

INSERT INTO riddle_progressions (student_id, riddle_id, status, attempt_count, started_at, completed_at, last_attempt_at)
VALUES
    (@student_sam_id, @riddle_1_id, 'completed', 2, '2026-05-20 13:00:00', '2026-05-20 13:15:00', '2026-05-20 13:14:00'),
    (@student_sam_id, @riddle_2_id, 'in_progress', 1, '2026-05-21 09:00:00', NULL, '2026-05-21 09:05:00');

INSERT INTO chapter_progressions (student_id, chapter_id, status, started_at, completed_at)
VALUES
    (@student_sam_id, @chapter_piano_id, 'completed', '2026-05-20 12:30:00', '2026-05-20 13:15:00'),
    (@student_sam_id, @chapter_base_id, 'in_progress', '2026-05-21 09:00:00', NULL);

-- Teacher disabled a narrative chapter for class 6A (chapter_target_classes entry)
INSERT INTO chapter_target_classes (chapter_id, class_id)
VALUES
    (@chapter_thales_id, @class_6a_id);

-- ------------------------------------------------------------------------------
-- Quick reference (login with username OR email + password "password")
-- ------------------------------------------------------------------------------
-- admin       | admin          | admin@matheopolis.local
-- teacher     | theo.teacher   | theo.teacher@ac-lyon.fr
-- student     | sam.student1   | (no email)  class CLS-6A01
-- student     | lia.student2   | (no email)  class CLS-6A01
-- student     | marc.student1  | (no email)  class CLS-7B01
-- free_user   | felix.demo     | felix.demo@gmail.com
