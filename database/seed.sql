-- Seed users and features for local development.
-- Password hash below corresponds to a known demo password for local testing only.
SET @demo_password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

INSERT INTO users (firstname, lastname, pseudo, email, password, role)
VALUES
    ('Ada', 'Admin', 'admin', 'admin@matheopolis.local', @demo_password_hash, 'admin'),
    ('Theo', 'Teacher', 'teacher1', 'teacher1@matheopolis.local', @demo_password_hash, 'teacher'),
    ('Nora', 'User', 'standard1', 'standard1@matheopolis.local', @demo_password_hash, 'standard');

SET @teacher_id = (SELECT id FROM users WHERE pseudo = 'teacher1' LIMIT 1);

INSERT INTO classes (name, code, teacher_id)
VALUES ('Classe 6A', 'CLS-6A01', @teacher_id);

SET @class_id = (SELECT id FROM classes WHERE code = 'CLS-6A01' LIMIT 1);

INSERT INTO users (firstname, lastname, pseudo, email, password, role, class_id)
VALUES
    ('Sam', 'Student', 'student1', 'student1@matheopolis.local', @demo_password_hash, 'student', @class_id),
    ('Lia', 'Student', 'student2', 'student2@matheopolis.local', @demo_password_hash, 'student', @class_id);

INSERT INTO teacher_codes (code, is_used, used_by_user_id)
VALUES
    ('TCH-DEMO-001', 0, NULL),
    ('TCH-DEMO-USED', 1, @teacher_id);

INSERT INTO puzzles (slug, title, statement, position, is_active)
VALUES
    ('enigme-1', 'Enigme 1', 'Find the missing number in the sequence: 2, 4, 8, ?', 1, 1),
    ('enigme-2', 'Enigme 2', 'Solve: if x + 7 = 15 then x = ?', 2, 1),
    ('enigme-3', 'Enigme 3', 'A triangle has angles 40 and 60 degrees. What is the third angle?', 3, 1);

INSERT INTO puzzle_hints (puzzle_id, hint_text, rank)
SELECT id, 'Try to identify the pattern first.', 1 FROM puzzles WHERE slug = 'enigme-1';

SET @student1_id = (SELECT id FROM users WHERE pseudo = 'student1' LIMIT 1);
SET @puzzle1_id = (SELECT id FROM puzzles WHERE slug = 'enigme-1' LIMIT 1);

INSERT INTO puzzle_progress (student_id, puzzle_id, is_solved, hint_unlocked, solved_at)
VALUES (@student1_id, @puzzle1_id, 1, 1, NOW());
