// Threat model note (STRIDE - Tampering / DoS):
// - Always use this pool with parameterized queries (pool.execute(sql, params)).
//   NEVER build SQL with string concatenation.
// - Pool limits are bounded to avoid the MySQL/Apache connection-exhaustion
//   incidents seen previously in production (server49).
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // bounded — prevents unbounded connection growth
  queueLimit: 20,
  enableKeepAlive: true,
});

async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    console.log("MySQL connection pool OK");
  } finally {
    conn.release();
  }
}

module.exports = { pool, testConnection };
