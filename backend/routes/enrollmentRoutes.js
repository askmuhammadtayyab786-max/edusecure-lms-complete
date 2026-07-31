const express = require("express");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const enrollmentController = require("../controllers/enrollmentController");

const router = express.Router();

router.post("/", verifyToken, requireRole("student"), enrollmentController.enroll);
router.get("/me", verifyToken, requireRole("student"), enrollmentController.myEnrollments);

module.exports = router;
