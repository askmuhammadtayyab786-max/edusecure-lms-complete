const { pool } = require("../config/db");
const { logAction } = require("../utils/audit");

// Public/listed courses — pagination to avoid unbounded queries (DoS note).
async function listCourses(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Number.parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `SELECT c.id, c.title, c.description, u.name AS instructor_name, c.created_at
       FROM courses c JOIN users u ON u.id = c.instructor_id
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return res.json({ page, limit, courses: rows });
  } catch (err) {
    next(err);
  }
}

async function getCourse(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT id, title, description, instructor_id, created_at FROM courses WHERE id = ?",
      [req.params.courseId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Course not found" });
    return res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// Instructor-only. instructor_id is taken from req.user (verified JWT),
// never from the request body.
async function createCourse(req, res, next) {
  try {
    const { title, description } = req.body;
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ error: "Title required (min 3 chars)" });
    }
    const [result] = await pool.execute(
      "INSERT INTO courses (title, description, instructor_id, created_at) VALUES (?, ?, ?, NOW())",
      [title.trim(), description || null, req.user.id]
    );
    await logAction({ actorId: req.user.id, action: "CREATE_COURSE", resourceType: "course", resourceId: result.insertId, req });
    return res.status(201).json({ id: result.insertId, title });
  } catch (err) {
    next(err);
  }
}

// Ownership already verified by requireCourseOwnership middleware before this runs.
async function updateCourse(req, res, next) {
  try {
    const { title, description } = req.body;
    await pool.execute(
      "UPDATE courses SET title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = ?",
      [title || null, description || null, req.params.courseId]
    );
    await logAction({ actorId: req.user.id, action: "UPDATE_COURSE", resourceType: "course", resourceId: req.params.courseId, req });
    return res.json({ message: "Course updated" });
  } catch (err) {
    next(err);
  }
}

async function deleteCourse(req, res, next) {
  try {
    await pool.execute("DELETE FROM courses WHERE id = ?", [req.params.courseId]);
    await logAction({ actorId: req.user.id, action: "DELETE_COURSE", resourceType: "course", resourceId: req.params.courseId, req });
    return res.json({ message: "Course deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse };
