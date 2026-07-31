const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { logAction } = require("../utils/audit");

async function listUsers(req, res, next) {
  try {
    const [rows] = await pool.execute("SELECT id, name, email, role, created_at FROM users");
    return res.json(rows);
  } catch (err) {
    next(err);
  }
}

// Only Admin can grant instructor/admin roles — this is the ONE place
// role can ever change, and it always requires an already-authenticated Admin.
async function createStaffAccount(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!["instructor", "admin"].includes(role)) {
      return res.status(400).json({ error: "role must be instructor or admin" });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())",
      [name, email, passwordHash, role]
    );
    await logAction({ actorId: req.user.id, action: `CREATE_${role.toUpperCase()}`, resourceType: "user", resourceId: result.insertId, req });
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit) || 50, 100);
    const [rows] = await pool.execute(
      "SELECT id, actor_id, action, resource_type, resource_id, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
    return res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createStaffAccount, getAuditLogs };
