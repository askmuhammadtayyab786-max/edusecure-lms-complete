-- Bootstrap the very first Admin account so someone can log in and use
-- the Admin Dashboard to create further Instructor/Admin accounts
-- (matches backend/controllers/adminController.js — staff accounts can
-- only be created by an existing Admin, never via public registration).
--
-- Login: admin@edusecure.lms / ChangeMe123!
-- IMPORTANT: log in once and change this password immediately, or better,
-- update the hash below before running this in any shared environment.

USE edusecure_lms;

INSERT INTO users (name, email, password_hash, role, created_at)
VALUES (
  'System Admin',
  'admin@edusecure.lms',
  '$2a$12$HDaT3V40acFWEHslkbhJt.qDRdWmp/.GpuK3M1Ot/9onmOqu3wQae', -- bcrypt hash of "ChangeMe123!"
  'admin',
  NOW()
)
ON DUPLICATE KEY UPDATE name = name; -- no-op if it already exists
