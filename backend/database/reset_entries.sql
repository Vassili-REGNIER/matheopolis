SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM quiz_responses WHERE id < 10000;
DELETE FROM quiz_progressions WHERE id < 10000;
DELETE FROM quiz_options WHERE id < 10000;
DELETE FROM quiz_questions WHERE id < 10000;
DELETE FROM quiz_target_classes WHERE id < 10000;
DELETE FROM quizzes WHERE id < 10000;
DELETE FROM riddle_responses WHERE id < 10000;
DELETE FROM riddle_progressions WHERE id < 10000;
DELETE FROM riddle_questions WHERE id < 10000;
DELETE FROM riddles WHERE id < 10000;
DELETE FROM dialogue_lines WHERE id < 10000;
DELETE FROM step_dialogues WHERE step_id < 10000;
DELETE FROM step_infos WHERE step_id < 10000;
DELETE FROM chapter_steps WHERE id < 10000;
DELETE FROM chapter_progressions WHERE id < 10000;
DELETE FROM chapter_target_classes WHERE id < 10000;
DELETE FROM chapters WHERE id < 10000;
DELETE FROM users WHERE id < 10000;
DELETE FROM classes WHERE id < 10000;

SET FOREIGN_KEY_CHECKS = 1;
