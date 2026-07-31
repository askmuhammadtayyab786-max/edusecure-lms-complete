-- EduSecure LMS — MySQL Schema
-- Threat model note: this schema is designed to be used ONLY through the
-- backend's `edusecure_app` DB user (see create_app_user.sql), which has
-- no DROP/GRANT/ALTER privileges — limiting blast radius if credentials
-- ever leak (see threat model, Information Disclosure section).

CREATE DATABASE IF NOT EXISTS edusecure_lms
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE edusecure_lms;

-- ---------------------------------------------------------------------
-- Users (Student / Instructor / Admin)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  email           VARCHAR(190)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,   -- bcrypt hash only, never plaintext
  role            ENUM('student','instructor','admin') NOT NULL DEFAULT 'student',
  token_version   INT NOT NULL DEFAULT 0,   -- bump to invalidate all refresh tokens
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------
CREATE TABLE courses (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  instructor_id   INT NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_courses_instructor (instructor_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Modules (grouping of lessons within a course)
-- ---------------------------------------------------------------------
CREATE TABLE modules (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  course_id       INT NOT NULL,
  title           VARCHAR(200) NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_modules_course (course_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Lessons (content within a module — PDF/video, validated at upload time
-- by the backend's Multer config; only the resulting file path is stored)
-- ---------------------------------------------------------------------
CREATE TABLE lessons (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  module_id       INT NOT NULL,
  title           VARCHAR(200) NOT NULL,
  content_path    VARCHAR(500),        -- randomized filename, not user-supplied
  content_type    ENUM('pdf','video','link') NOT NULL DEFAULT 'pdf',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_lessons_module (module_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Enrollments
-- ---------------------------------------------------------------------
CREATE TABLE enrollments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  course_id       INT NOT NULL,
  enrolled_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY uq_enrollment (student_id, course_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Quizzes
-- ---------------------------------------------------------------------
CREATE TABLE quizzes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  module_id       INT,
  title           VARCHAR(200) NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Quiz Questions
-- correct_answer is ONLY ever read by the backend's submitQuiz controller.
-- The getQuizForStudent controller explicitly excludes this column from
-- its SELECT — see threat model, Tampering section.
-- ---------------------------------------------------------------------
CREATE TABLE quiz_questions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id         INT NOT NULL,
  question        TEXT NOT NULL,
  options_json    JSON NOT NULL,        -- e.g. ["Option A","Option B","Option C"]
  correct_answer  VARCHAR(500) NOT NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_questions_quiz (quiz_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Quiz Results (grading is server-side only; see quizController.submitQuiz)
-- ---------------------------------------------------------------------
CREATE TABLE quiz_results (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  quiz_id         INT NOT NULL,
  score           INT NOT NULL,          -- 0-100, computed server-side
  submitted_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_results_student (student_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Audit Logs — Repudiation mitigation (see threat model Section 4/STRIDE-R)
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id        INT,
  action          VARCHAR(100) NOT NULL,
  resource_type   VARCHAR(50),
  resource_id     VARCHAR(50),
  ip_address      VARCHAR(45),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_actor (actor_id)
) ENGINE=InnoDB;
