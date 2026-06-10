-- ==============================================================================
-- Matheopolis - Demo student progressions (chapters, riddles, quizzes)
-- References content from seeds/content/scenario.sql and seeds/demo/quizzes.sql by slug/title.
-- ==============================================================================

SET @student_sam_id = (SELECT id FROM users WHERE username = 'sam.student1' LIMIT 1);
SET @student_lia_id = (SELECT id FROM users WHERE username = 'lia.student2' LIMIT 1);

SET @chapter_piano_id = (SELECT id FROM chapters WHERE slug = 'piano-fractions' LIMIT 1);
SET @chapter_base_id = (SELECT id FROM chapters WHERE slug = 'base-conversion' LIMIT 1);

SET @riddle_piano_challenge_id = (SELECT id FROM riddles WHERE slug = 'piano-challenge' LIMIT 1);
SET @riddle_base_challenge_id = (SELECT id FROM riddles WHERE slug = 'base-conv-challenge-date' LIMIT 1);

INSERT INTO chapter_progressions (user_id, chapter_id, status, current_step_index, score, started_at, completed_at)
VALUES
    (@student_sam_id, @chapter_piano_id, 'completed', 8, 100, '2026-05-20 12:30:00', '2026-05-20 13:15:00'),
    (@student_sam_id, @chapter_base_id, 'in_progress', 3, NULL, '2026-05-21 09:00:00', NULL);

INSERT INTO riddle_progressions (user_id, riddle_id, status, current_question_index, attempt_count, score, started_at, completed_at)
VALUES
    (@student_sam_id, @riddle_piano_challenge_id, 'completed', 6, 2, 6, '2026-05-20 13:00:00', '2026-05-20 13:15:00'),
    (@student_sam_id, @riddle_base_challenge_id, 'in_progress', 1, 1, NULL, '2026-05-21 09:00:00', NULL);

SET @quiz_public_id = (SELECT id FROM quizzes WHERE title = 'Fractions warm-up' LIMIT 1);
SET @quiz_private_granted_id = (SELECT id FROM quizzes WHERE title = 'Secret review' LIMIT 1);

INSERT INTO quiz_progressions (user_id, quiz_id, status, attempt_count, current_question_index, score, started_at, completed_at)
VALUES
    (@student_sam_id, @quiz_public_id, 'completed', 1, 2, 2, '2026-05-23 14:00:00', '2026-05-23 14:10:00'),
    (@student_lia_id, @quiz_private_granted_id, 'in_progress', 1, 0, NULL, '2026-05-24 09:00:00', NULL);

SET @sam_quiz_progress_id = (
    SELECT id FROM quiz_progressions
    WHERE user_id = @student_sam_id AND quiz_id = @quiz_public_id
    LIMIT 1
);

SET @qq1_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_public_id AND order_index = 0 LIMIT 1);
SET @qq2_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_public_id AND order_index = 1 LIMIT 1);

SET @opt_q1_correct = (SELECT id FROM quiz_options WHERE question_id = @qq1_id AND is_correct = TRUE LIMIT 1);
SET @opt_q2_correct_a = (SELECT id FROM quiz_options WHERE question_id = @qq2_id AND label = '2/4' LIMIT 1);
SET @opt_q2_correct_b = (SELECT id FROM quiz_options WHERE question_id = @qq2_id AND label = '3/6' LIMIT 1);

INSERT INTO quiz_responses (progression_id, question_id, option_id, attempt_number, created_at)
VALUES
    (@sam_quiz_progress_id, @qq1_id, @opt_q1_correct, 1, '2026-05-23 14:05:00'),
    (@sam_quiz_progress_id, @qq2_id, @opt_q2_correct_a, 1, '2026-05-23 14:08:00'),
    (@sam_quiz_progress_id, @qq2_id, @opt_q2_correct_b, 1, '2026-05-23 14:08:00');
