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
-- Quizzes
-- ------------------------------------------------------------------------------
INSERT INTO quizzes (title, description, creator_id, status, ask_admin, position, created_at, updated_at)
VALUES
    ('Fractions warm-up', 'Public quiz created by admin — accessible to everyone by default.', @admin_id, 'public', FALSE, 10, '2026-05-22 10:00:00', '2026-05-22 10:00:00'),
    ('Advanced algebra', 'Public quiz restricted for class 6A via target-classes override.', @admin_id, 'public', FALSE, 11, '2026-05-22 10:05:00', '2026-05-22 10:05:00'),
    ('Class 6A checkpoint', 'Private teacher quiz with publication requested (ask_admin = true).', @teacher_id, 'private', TRUE, 12, '2026-05-22 11:00:00', '2026-05-22 11:00:00'),
    ('Secret review', 'Private teacher quiz granted to class 6A only.', @teacher_id, 'private', FALSE, 13, '2026-05-22 11:05:00', '2026-05-22 11:05:00');

SET @quiz_public_id = (SELECT id FROM quizzes WHERE title = 'Fractions warm-up' LIMIT 1);
SET @quiz_restricted_public_id = (SELECT id FROM quizzes WHERE title = 'Advanced algebra' LIMIT 1);
SET @quiz_pending_id = (SELECT id FROM quizzes WHERE title = 'Class 6A checkpoint' LIMIT 1);
SET @quiz_private_granted_id = (SELECT id FROM quizzes WHERE title = 'Secret review' LIMIT 1);

-- Quiz 1: two questions (radio + checkbox)
INSERT INTO quiz_questions (quiz_id, label, order_index, type)
VALUES
    (@quiz_public_id, 'What is 1/2 + 1/2?', 0, 'radio'),
    (@quiz_public_id, 'Which of these equal 1/2?', 1, 'checkbox');

SET @qq1_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_public_id AND order_index = 0 LIMIT 1);
SET @qq2_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_public_id AND order_index = 1 LIMIT 1);

INSERT INTO quiz_options (question_id, label, is_correct)
VALUES
    (@qq1_id, '1', TRUE),
    (@qq1_id, '1/4', FALSE),
    (@qq2_id, '2/4', TRUE),
    (@qq2_id, '3/6', TRUE),
    (@qq2_id, '1/3', FALSE);

-- Quiz 3: one radio question
INSERT INTO quiz_questions (quiz_id, label, order_index, type)
VALUES
    (@quiz_pending_id, 'What is 3 x 4?', 0, 'radio');

SET @qq3_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_pending_id AND order_index = 0 LIMIT 1);

INSERT INTO quiz_options (question_id, label, is_correct)
VALUES
    (@qq3_id, '12', TRUE),
    (@qq3_id, '7', FALSE),
    (@qq3_id, '34', FALSE);

-- Quiz 4: one select question
INSERT INTO quiz_questions (quiz_id, label, order_index, type)
VALUES
    (@quiz_private_granted_id, 'Pick the even number.', 0, 'select');

SET @qq4_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_private_granted_id AND order_index = 0 LIMIT 1);

INSERT INTO quiz_options (question_id, label, is_correct)
VALUES
    (@qq4_id, '4', TRUE),
    (@qq4_id, '5', FALSE),
    (@qq4_id, '9', FALSE);

-- Class access overrides
INSERT INTO quiz_target_classes (quiz_id, class_id, is_active)
VALUES
    (@quiz_restricted_public_id, @class_6a_id, FALSE),
    (@quiz_private_granted_id, @class_6a_id, TRUE);

-- Sam completed the public quiz once; Lia has an in-progress attempt on the granted private quiz
INSERT INTO quiz_progressions (student_id, quiz_id, status, attempt_count, current_question_index, last_score, best_score, started_at, completed_at)
VALUES
    (@student_sam_id, @quiz_public_id, 'completed', 1, 2, 2, 2, '2026-05-23 14:00:00', '2026-05-23 14:10:00'),
    (@student_lia_id, @quiz_private_granted_id, 'in_progress', 1, 0, NULL, NULL, '2026-05-24 09:00:00', NULL);

SET @sam_quiz_progress_id = (
    SELECT id FROM quiz_progressions
    WHERE student_id = @student_sam_id AND quiz_id = @quiz_public_id
    LIMIT 1
);

SET @opt_q1_correct = (SELECT id FROM quiz_options WHERE question_id = @qq1_id AND is_correct = TRUE LIMIT 1);
SET @opt_q2_correct_a = (SELECT id FROM quiz_options WHERE question_id = @qq2_id AND label = '2/4' LIMIT 1);
SET @opt_q2_correct_b = (SELECT id FROM quiz_options WHERE question_id = @qq2_id AND label = '3/6' LIMIT 1);

INSERT INTO quiz_responses (progression_id, question_id, option_id, attempt_number, created_at)
VALUES
    (@sam_quiz_progress_id, @qq1_id, @opt_q1_correct, 1, '2026-05-23 14:05:00'),
    (@sam_quiz_progress_id, @qq2_id, @opt_q2_correct_a, 1, '2026-05-23 14:08:00'),
    (@sam_quiz_progress_id, @qq2_id, @opt_q2_correct_b, 1, '2026-05-23 14:08:00');

-- ------------------------------------------------------------------------------
-- Quick reference (login with username OR email + password "password")
-- ------------------------------------------------------------------------------
-- admin       | admin          | admin@matheopolis.local
-- teacher     | theo.teacher   | theo.teacher@ac-lyon.fr
-- student     | sam.student1   | (no email)  class CLS-6A01
-- student     | lia.student2   | (no email)  class CLS-6A01
-- student     | marc.student1  | (no email)  class CLS-7B01
-- free_user   | felix.demo     | felix.demo@gmail.com
