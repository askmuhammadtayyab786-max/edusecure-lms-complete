const { pool } = require("../config/db");
const { logAction } = require("../utils/audit");

// Student enrolls themselves — student_id from JWT, never from req.body.
async function enroll(req, res, next) {
  try {
    const { courseId } = req.body;
    const [course] = await pool.execute("SELECT id FROM courses WHERE id = ?", [courseId]);
    if (course.length === 0) return res.status(404).json({ error: "Course not found" });

    const [existing] = await pool.execute(
      "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?",
      [req.user.id, courseId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Already enrolled" });
    }

    const [result] = await pool.execute(
      "INSERT INTO enrollments (student_id, course_id, enrolled_at) VALUES (?, ?, NOW())",
      [req.user.id, courseId]
    );
    await logAction({ actorId: req.user.id, action: "ENROLL", resourceType: "course", resourceId: courseId, req });
    return res.status(201).json({ id: result.insertId, message: "Enrolled successfully" });
  } catch (err) {
    next(err);
  }
}

// A student can only list THEIR OWN enrollments (enforced via requireSelfOrAdmin
// on the route + this query is scoped to req.user.id regardless).
async function myEnrollments(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT e.id, c.id AS course_id, c.title, e.enrolled_at
       FROM enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = ?`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { enroll, myEnrollments };
