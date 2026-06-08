-- ==============================================================================
-- Matheopolis - Demo users and classes
--
-- Quick reference (login with username OR email + password "password")
-- ------------------------------------------------------------------------------
-- admin       | admin          | admin@matheopolis.local
-- teacher     | theo.teacher   | theo.teacher@ac-lyon.fr
-- student     | sam.student1   | (no email)  class CLS-6A01
-- student     | lia.student2   | (no email)  class CLS-6A01
-- student     | marc.student1  | (no email)  class CLS-7B01
-- free_user   | felix.demo     | felix.demo@gmail.com
-- ==============================================================================
SET @demo_password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

INSERT INTO users (first_name, last_name, username, email, email_verified_at, password_hash, role, class_id, created_at)
VALUES
    ('Ada', 'Admin', 'admin', 'admin@matheopolis.local', '2026-01-10 09:00:00', @demo_password_hash, 'admin', NULL, '2026-01-10 09:00:00'),
    ('Theo', 'Teacher', 'theo.teacher', 'theo.teacher@ac-lyon.fr', '2026-01-10 09:05:00', @demo_password_hash, 'teacher', NULL, '2026-01-10 09:05:00'),
    ('Felix', 'Demo', 'felix.demo', 'felix.demo@gmail.com', '2026-01-10 09:10:00', @demo_password_hash, 'free_user', NULL, '2026-01-10 09:10:00');

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
