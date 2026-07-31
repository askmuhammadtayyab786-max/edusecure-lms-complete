const express = require("express");
const { verifyToken } = require("../middleware/auth");
const { requireRole, requireCourseOwnership } = require("../middleware/roles");
const courseController = require("../controllers/courseController");

const router = express.Router();

router.get("/", courseController.listCourses);
router.get("/:courseId", courseController.getCourse);

router.post("/", verifyToken, requireRole("instructor", "admin"), courseController.createCourse);
router.put("/:courseId", verifyToken, requireRole("instructor", "admin"), requireCourseOwnership, courseController.updateCourse);
router.delete("/:courseId", verifyToken, requireRole("instructor", "admin"), requireCourseOwnership, courseController.deleteCourse);

module.exports = router;
