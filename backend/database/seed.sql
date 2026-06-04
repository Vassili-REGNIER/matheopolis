-- ==============================================================================
-- Matheopolis - Development seed data
--
-- Quick reference (login with username OR email + password "password")
-- ------------------------------------------------------------------------------
-- admin       | admin          | admin@matheopolis.local
-- teacher     | theo.teacher   | theo.teacher@ac-lyon.fr
-- student     | sam.student1   | (no email)  class CLS-6A01
-- student     | lia.student2   | (no email)  class CLS-6A01
-- student     | marc.student1  | (no email)  class CLS-7B01
-- free_user   | felix.demo     | felix.demo@gmail.com
-- Quizzes
-- ==============================================================================
SET @demo_password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

INSERT INTO users (first_name, last_name, username, email, password_hash, role, class_id, created_at)
VALUES
    ('Ada', 'Admin', 'admin', 'admin@matheopolis.local', @demo_password_hash, 'admin', NULL, '2026-01-10 09:00:00'),
    ('Theo', 'Teacher', 'theo.teacher', 'theo.teacher@ac-lyon.fr', @demo_password_hash, 'teacher', NULL, '2026-01-10 09:05:00'),
    ('Felix', 'Demo', 'felix.demo', 'felix.demo@gmail.com', @demo_password_hash, 'free_user', NULL, '2026-01-10 09:10:00');

SET @teacher_id = (SELECT id FROM users WHERE username = 'theo.teacher' LIMIT 1);

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
-- Chapters
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
-- Chapter: piano-fractions (practice riddle, challenge riddle, end info)
-- ------------------------------------------------------------------------------
INSERT INTO chapter_steps (chapter_id, order_index, type) VALUES
    (@chapter_piano_id, 0, 'riddle'),
    (@chapter_piano_id, 1, 'riddle'),
    (@chapter_piano_id, 2, 'info');

SET @step_piano_practice = (SELECT id FROM chapter_steps WHERE chapter_id = @chapter_piano_id AND order_index = 0 LIMIT 1);
SET @step_piano_challenge = (SELECT id FROM chapter_steps WHERE chapter_id = @chapter_piano_id AND order_index = 1 LIMIT 1);
SET @step_piano_end_info = (SELECT id FROM chapter_steps WHERE chapter_id = @chapter_piano_id AND order_index = 2 LIMIT 1);

INSERT INTO riddles (step_id, slug, game_id, mode, title, instruction, intro_text, completion_message, game_params, created_at)
VALUES
    (@step_piano_practice, 'piano-fractions-practice', 'PianoFractions', 'practice', 'Premieres quintes',
     'Cliquez sur la note qui correspond a la quinte de la fraction reduite.',
     'Reduisez la fraction affichee, puis multipliez par 3/2 pour trouver sa quinte.',
     'Bravo ! Passez a l''epreuve pour completer la melodie.', NULL, '2026-01-15 10:00:00'),
    (@step_piano_challenge, 'piano-fractions-challenge', 'PianoFractions', 'challenge', 'Le piano de Pythagore',
     'Simplifiez la fraction affichee, puis trouvez la note qui correspond a sa quinte.',
     NULL,
     'Melodie terminee !', NULL, '2026-01-15 10:01:00');

INSERT INTO step_infos (step_id, title, text, button_text, theme)
VALUES
    (@step_piano_end_info, 'Melodie reconstituee', 'Les fractions ont chante juste. Laurence peut continuer son enquete.',
     'Retour a la carte', 'endChapter');

SET @riddle_piano_practice_id = (SELECT id FROM riddles WHERE slug = 'piano-fractions-practice' LIMIT 1);
SET @riddle_piano_challenge_id = (SELECT id FROM riddles WHERE slug = 'piano-fractions-challenge' LIMIT 1);

-- ------------------------------------------------------------------------------
-- Chapter: base-conversion (intro info, practice, challenge, end info)
-- ------------------------------------------------------------------------------
INSERT INTO chapter_steps (chapter_id, order_index, type) VALUES
    (@chapter_base_id, 0, 'info'),
    (@chapter_base_id, 1, 'riddle'),
    (@chapter_base_id, 2, 'riddle'),
    (@chapter_base_id, 3, 'info');

SET @step_base_intro = (SELECT id FROM chapter_steps WHERE chapter_id = @chapter_base_id AND order_index = 0 LIMIT 1);
SET @step_base_practice = (SELECT id FROM chapter_steps WHERE chapter_id = @chapter_base_id AND order_index = 1 LIMIT 1);
SET @step_base_challenge = (SELECT id FROM chapter_steps WHERE chapter_id = @chapter_base_id AND order_index = 2 LIMIT 1);
SET @step_base_end_info = (SELECT id FROM chapter_steps WHERE chapter_id = @chapter_base_id AND order_index = 3 LIMIT 1);

INSERT INTO step_infos (step_id, title, text, button_text, theme) VALUES
    (@step_base_intro, 'Conversion de base',
     'Chaque civilisation a invente ses propres facons d''ecrire les nombres. A vous de decoder.',
     'Commencer', 'default'),
    (@step_base_end_info, 'Code dechiffre',
     'Vous avez traverse les bases sans perdre le fil.',
     'Retour a la carte', 'endChapter');

INSERT INTO riddles (step_id, slug, game_id, mode, title, instruction, intro_text, completion_message, game_params, created_at)
VALUES
    (@step_base_practice, 'base-conversion-practice', 'BaseConversion', 'practice', 'Conversion de base',
     'Combien vaut 101010 en base 10 ?',
     'En base 2, chaque position vaut une puissance de 2.',
     'Exact : vous pouvez passer a l''epreuve.', NULL, '2026-01-15 10:05:00'),
    (@step_base_challenge, 'base-conversion-challenge', 'BaseConversion', 'challenge', 'Conversion de base',
     'Transformez les nombres binaires en base 10.',
     NULL,
     'Epreuve terminee !', NULL, '2026-01-15 10:06:00');

SET @riddle_base_practice_id = (SELECT id FROM riddles WHERE slug = 'base-conversion-practice' LIMIT 1);
SET @riddle_base_challenge_id = (SELECT id FROM riddles WHERE slug = 'base-conversion-challenge' LIMIT 1);

-- ------------------------------------------------------------------------------
-- Chapter: thales-ratio (intro info, challenge riddle, end info)
-- ------------------------------------------------------------------------------
INSERT INTO chapter_steps (chapter_id, order_index, type) VALUES
    (@chapter_thales_id, 0, 'info'),
    (@chapter_thales_id, 1, 'riddle'),
    (@chapter_thales_id, 2, 'info');

SET @step_thales_intro = (SELECT id FROM chapter_steps WHERE chapter_id = @chapter_thales_id AND order_index = 0 LIMIT 1);
SET @step_thales_challenge = (SELECT id FROM chapter_steps WHERE chapter_id = @chapter_thales_id AND order_index = 1 LIMIT 1);
SET @step_thales_end_info = (SELECT id FROM chapter_steps WHERE chapter_id = @chapter_thales_id AND order_index = 2 LIMIT 1);

INSERT INTO step_infos (step_id, title, text, button_text, theme) VALUES
    (@step_thales_intro, 'Theoreme de Thales',
     'Dans la cite, les triangles alignes cachent des proportions.',
     'Observer', 'default'),
    (@step_thales_end_info, 'Proportion retrouvee',
     'Les longueurs concordent. Le passage geometrique s''ouvre.',
     'Retour a la carte', 'endChapter');

INSERT INTO riddles (step_id, slug, game_id, mode, title, instruction, intro_text, completion_message, game_params, created_at)
VALUES
    (@step_thales_challenge, 'thales-ratio-challenge', 'ThalesRatio', 'challenge', 'Theoreme de Thales',
     'Retrouvez la longueur manquante dans deux triangles proportionnels.',
     NULL,
     'Epreuve terminee !', NULL, '2026-01-15 10:10:00');

SET @riddle_thales_challenge_id = (SELECT id FROM riddles WHERE slug = 'thales-ratio-challenge' LIMIT 1);

-- ------------------------------------------------------------------------------
-- Riddle questions
-- ------------------------------------------------------------------------------
INSERT INTO riddle_questions (riddle_id, order_index, prompt, answer, hint, difficulty, metadata)
VALUES
    (@riddle_piano_practice_id, 0, '2/2', 'SOL', '2/2 se reduit en 1. Multipliez par 3/2.', 1, NULL),
    (@riddle_piano_practice_id, 1, '6/4', 'RE', '6/4 se reduit en 3/2.', 1, NULL),
    (@riddle_piano_practice_id, 2, '18/16', 'LA', '18/16 se reduit en 9/8.', 1, NULL),
    (@riddle_piano_challenge_id, 0, '2/2', 'SOL', '2/2 se reduit en 1.', 1, NULL),
    (@riddle_piano_challenge_id, 1, '6/4', 'RE', '6/4 se reduit en 3/2.', 1, NULL),
    (@riddle_piano_challenge_id, 2, '18/16', 'LA', '18/16 se reduit en 9/8.', 1, NULL),
    (@riddle_piano_challenge_id, 3, '54/32', 'MI', '54/32 se reduit en 27/16.', 1, NULL),
    (@riddle_piano_challenge_id, 4, '162/128', 'SI', '162/128 se reduit en 81/64.', 1, NULL),
    (@riddle_piano_challenge_id, 5, '16/12', 'DO+', '16/12 se reduit en 4/3.', 1, NULL),
    (@riddle_base_practice_id, 0, '101010', '42', '101010 = 32 + 8 + 2.', 1, NULL),
    (@riddle_base_challenge_id, 0, '101010', '42', '32 + 8 + 2', 1, NULL),
    (@riddle_base_challenge_id, 1, '1111', '15', '8 + 4 + 2 + 1', 1, NULL),
    (@riddle_base_challenge_id, 2, '100000', '32', 'Une seule puissance de deux.', 1, NULL),
    (@riddle_thales_challenge_id, 0, '6 / 4 = x / 6', '9', 'x = 9', 1,
     '{"options":["7.5","8","9","12"],"largeTriangle":{"side":"6","unknown":"x"},"smallTriangle":{"side":"4","unknown":"6"}}');

-- ------------------------------------------------------------------------------
-- Sample progressions
-- ------------------------------------------------------------------------------
INSERT INTO chapter_progressions (user_id, chapter_id, status, started_at, completed_at)
VALUES
    (@student_sam_id, @chapter_piano_id, 'completed', '2026-05-20 12:30:00', '2026-05-20 13:15:00'),
    (@student_sam_id, @chapter_base_id, 'in_progress', '2026-05-21 09:00:00', NULL);

INSERT INTO riddle_progressions (user_id, riddle_id, status, current_question_index, attempt_count, started_at, completed_at, last_attempt_at)
VALUES
    (@student_sam_id, @riddle_piano_challenge_id, 'completed', 6, 2, '2026-05-20 13:00:00', '2026-05-20 13:15:00', '2026-05-20 13:14:00'),
    (@student_sam_id, @riddle_base_challenge_id, 'in_progress', 1, 1, '2026-05-21 09:00:00', NULL, '2026-05-21 09:05:00');

INSERT INTO chapter_target_classes (chapter_id, class_id, is_active)
VALUES
    (@chapter_thales_id, @class_6a_id, FALSE);


INSERT INTO quizzes (title, description, creator_id, status, ask_admin, position, created_at, updated_at)
VALUES
    ('L''Histoire de Laurence', 'MCQ on the book — public flagship quiz.', @admin_id, 'public', FALSE, 0, '2026-01-14 09:00:00', '2026-01-14 09:00:00'),
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

INSERT INTO quiz_progressions (user_id, quiz_id, status, attempt_count, current_question_index, last_score, best_score, started_at, completed_at)
VALUES
    (@student_sam_id, @quiz_public_id, 'completed', 1, 2, 2, 2, '2026-05-23 14:00:00', '2026-05-23 14:10:00'),
    (@student_lia_id, @quiz_private_granted_id, 'in_progress', 1, 0, NULL, NULL, '2026-05-24 09:00:00', NULL);

SET @sam_quiz_progress_id = (
    SELECT id FROM quiz_progressions
    WHERE user_id = @student_sam_id AND quiz_id = @quiz_public_id
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
