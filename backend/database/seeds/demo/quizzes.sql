-- ==============================================================================
-- Matheopolis - Demo quizzes (permissions, visibility, class targeting)
-- Excludes the flagship Laurence quiz (see seeds/content/quiz-laurence.sql).
-- ==============================================================================

SET @teacher_id = (SELECT id FROM users WHERE username = 'theo.teacher' LIMIT 1);
SET @admin_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);
SET @class_6a_id = (SELECT id FROM classes WHERE code = 'CLS-6A01' LIMIT 1);

INSERT INTO quizzes (title, description, creator_id, status, ask_admin, position, created_at, updated_at)
VALUES
    ('Fractions warm-up', 'Public quiz created by admin.', @admin_id, 'public', FALSE, 10, '2026-05-22 10:00:00', '2026-05-22 10:00:00'),
    ('Advanced algebra', 'Public quiz restricted for class 6A.', @admin_id, 'public', FALSE, 11, '2026-05-22 10:05:00', '2026-05-22 10:05:00'),
    ('Class 6A checkpoint', 'Private teacher quiz with publication requested.', @teacher_id, 'private', TRUE, 12, '2026-05-22 11:00:00', '2026-05-22 11:05:00'),
    ('Secret review', 'Private teacher quiz granted to class 6A only.', @teacher_id, 'private', FALSE, 13, '2026-05-22 11:05:00', '2026-05-22 11:05:00');

SET @quiz_public_id = (SELECT id FROM quizzes WHERE title = 'Fractions warm-up' LIMIT 1);
SET @quiz_restricted_public_id = (SELECT id FROM quizzes WHERE title = 'Advanced algebra' LIMIT 1);
SET @quiz_pending_id = (SELECT id FROM quizzes WHERE title = 'Class 6A checkpoint' LIMIT 1);
SET @quiz_private_granted_id = (SELECT id FROM quizzes WHERE title = 'Secret review' LIMIT 1);

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

INSERT INTO quiz_questions (quiz_id, label, order_index, type)
VALUES
    (@quiz_pending_id, 'What is 3 x 4?', 0, 'radio');

SET @qq3_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_pending_id AND order_index = 0 LIMIT 1);

INSERT INTO quiz_options (question_id, label, is_correct)
VALUES
    (@qq3_id, '12', TRUE),
    (@qq3_id, '7', FALSE),
    (@qq3_id, '34', FALSE);

INSERT INTO quiz_questions (quiz_id, label, order_index, type)
VALUES
    (@quiz_private_granted_id, 'Pick the even number.', 0, 'select');

SET @qq4_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_private_granted_id AND order_index = 0 LIMIT 1);

INSERT INTO quiz_options (question_id, label, is_correct)
VALUES
    (@qq4_id, '4', TRUE),
    (@qq4_id, '5', FALSE),
    (@qq4_id, '9', FALSE);

INSERT INTO quiz_target_classes (quiz_id, class_id, is_active)
VALUES
    (@quiz_restricted_public_id, @class_6a_id, FALSE),
    (@quiz_private_granted_id, @class_6a_id, TRUE);
