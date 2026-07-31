const express = require("express");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const quizController = require("../controllers/quizController");

const router = express.Router();

router.post("/", verifyToken, requireRole("instructor", "admin"), quizController.createQuiz);
router.get("/:quizId", verifyToken, requireRole("student"), quizController.getQuizForStudent);
router.post("/:quizId/submit", verifyToken, requireRole("student"), quizController.submitQuiz);
router.get("/results/me", verifyToken, requireRole("student"), quizController.myResults);

module.exports = router;
