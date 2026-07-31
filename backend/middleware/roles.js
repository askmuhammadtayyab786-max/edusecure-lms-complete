const { pool } = require("../config/db");

// Threat model note (STRIDE - Elevation of Privilege / Info Disclosure):
// Being logged in is NOT enough. Every sensitive route must also check
// (a) role, and (b) ownership where relevant (e.g. an Instructor may only
// edit THEIR OWN courses; a Student may only view THEIR OWN quiz results).

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Ensures the logged-in Instructor owns the course referenced by :courseId.
// Prevents IDOR: Instructor A editing Instructor B's course by guessing an ID.
async function requireCourseOwnership(req, res, next) {
  if (req.user.role === "admin") return next(); // admins bypass ownership

  const courseId = req.params.courseId || req.body.courseId;
  if (!courseId) return res.status(400).json({ error: "courseId required" });

  const [rows] = await pool.execute(
    "SELECT instructor_id FROM courses WHERE id = ?",
    [courseId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: "Course not found" });
  }
  if (rows[0].instructor_id !== req.user.id) {
    return res.status(403).json({ error: "You do not own this course" });
  }
  next();
}

// Ensures a Student can only access THEIR OWN enrollment/quiz-result records.
async function requireSelfOrAdmin(req, res, next) {
  const targetStudentId = Number(req.params.studentId || req.body.studentId);
  if (req.user.role === "admin" || req.user.role === "instructor") return next();
  if (req.user.id !== targetStudentId) {
    return res.status(403).json({ error: "You can only access your own data" });
  }
  next();
}

module.exports = { requireRole, requireCourseOwnership, requireSelfOrAdmin };
