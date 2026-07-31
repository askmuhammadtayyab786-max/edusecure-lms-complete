const { pool } = require("../config/db");
const { logAction } = require("../utils/audit");

// Instructor-only: create a quiz with questions + correct answers.
// correct_answer is stored server-side and NEVER returned by getQuizForStudent.
async function createQuiz(req, res, next) {
  try {
    const { moduleId, title, questions } = req.body;
    // questions: [{ question, options: [...], correctAnswer }]
    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "title and at least one question required" });
    }

    const [quizResult] = await pool.execute(
      "INSERT INTO quizzes (module_id, title, created_at) VALUES (?, ?, NOW())",
      [moduleId, title]
    );
    const quizId = quizResult.insertId;

    for (const q of questions) {
      await pool.execute(
        "INSERT INTO quiz_questions (quiz_id, question, options_json, correct_answer) VALUES (?, ?, ?, ?)",
        [quizId, q.question, JSON.stringify(q.options), q.correctAnswer]
      );
    }

    await logAction({ actorId: req.user.id, action: "CREATE_QUIZ", resourceType: "quiz", resourceId: quizId, req });
    return res.status(201).json({ id: quizId, message: "Quiz created" });
  } catch (err) {
    next(err);
  }
}

// STRIDE - Tampering mitigation: this endpoint explicitly excludes
// correct_answer from the SELECT. The client only ever sees question text
// and options — never which option is correct.
async function getQuizForStudent(req, res, next) {
  try {
    const [quizRows] = await pool.execute("SELECT id, title FROM quizzes WHERE id = ?", [req.params.quizId]);
    if (quizRows.length === 0) return res.status(404).json({ error: "Quiz not found" });

    const [questions] = await pool.execute(
      "SELECT id, question, options_json FROM quiz_questions WHERE quiz_id = ?",
      [req.params.quizId]
    );

    return res.json({
      ...quizRows[0],
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: JSON.parse(q.options_json),
        // NOTE: correct_answer intentionally omitted
      })),
    });
  } catch (err) {
    next(err);
  }
}

// Student submits answers -> grading happens ENTIRELY here, server-side.
// Client sends only { answers: [{questionId, selectedOption}] } — never a score.
async function submitQuiz(req, res, next) {
  try {
    const { answers } = req.body;
    const quizId = req.params.quizId;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "answers array required" });
    }

    const [questions] = await pool.execute(
      "SELECT id, correct_answer FROM quiz_questions WHERE quiz_id = ?",
      [quizId]
    );
    const answerKey = new Map(questions.map((q) => [q.id, q.correct_answer]));

    let correctCount = 0;
    for (const a of answers) {
      if (answerKey.has(a.questionId) && answerKey.get(a.questionId) === a.selectedOption) {
        correctCount++;
      }
    }
    const score = Math.round((correctCount / questions.length) * 100);

    const [result] = await pool.execute(
      "INSERT INTO quiz_results (student_id, quiz_id, score, submitted_at) VALUES (?, ?, ?, NOW())",
      [req.user.id, quizId, score]
    );

    await logAction({ actorId: req.user.id, action: "SUBMIT_QUIZ", resourceType: "quiz", resourceId: quizId, req });
    return res.status(201).json({ resultId: result.insertId, score });
  } catch (err) {
    next(err);
  }
}

// A student may only view THEIR OWN results (requireSelfOrAdmin on the route).
async function myResults(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT qr.id, q.title AS quiz_title, qr.score, qr.submitted_at
       FROM quiz_results qr JOIN quizzes q ON q.id = qr.quiz_id
       WHERE qr.student_id = ?`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { createQuiz, getQuizForStudent, submitQuiz, myResults };
