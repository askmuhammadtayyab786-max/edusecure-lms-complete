-- Threat model note (Design Decision #3): the backend app must NEVER
-- connect as root. This user can only read/write data — it cannot
-- DROP tables, CREATE/ALTER schema, or GRANT privileges to anyone else.
-- Run this as root/admin ONCE during setup, then put these exact
-- credentials in backend/.env (DB_USER / DB_PASSWORD).

CREATE USER IF NOT EXISTS 'edusecure_app'@'%'
  IDENTIFIED BY 'CHANGE_ME_TO_A_STRONG_PASSWORD';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON edusecure_lms.*
  TO 'edusecure_app'@'%';

-- Explicitly NOT granted: DROP, ALTER, CREATE, GRANT OPTION, SUPER, FILE.

FLUSH PRIVILEGES;

-- Verify:
--   SHOW GRANTS FOR 'edusecure_app'@'%';
