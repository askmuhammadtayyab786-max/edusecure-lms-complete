const { pool } = require("../config/db");

// Threat model note (STRIDE - Repudiation):
// Every sensitive action (grade change, enrollment, course delete, role
// change) must be logged with WHO did WHAT, WHEN, from WHERE.
async function logAction({ actorId, action, resourceType, resourceId, req }) {
  try {
    await pool.execute(
      `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        actorId || null,
        action,
        resourceType || null,
        resourceId || null,
        req ? req.ip : null,
      ]
    );
  } catch (err) {
    // Audit logging must never crash the main request — log and continue.
    console.error("Audit log failed:", err.message);
  }
}

module.exports = { logAction };
