ALTER TABLE users
    MODIFY role ENUM('admin', 'teacher', 'student', 'free_user') NOT NULL DEFAULT 'student';
