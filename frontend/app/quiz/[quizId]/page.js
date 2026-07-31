"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";

export default function QuizPage() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // The response here contains question text + options ONLY.
    // There is no "correctAnswer" field to inspect in devtools — it was
    // never sent, not just hidden client-side.
    api.get(`/quizzes/${quizId}`).then(setQuiz).catch((e) => setError(e.message));
  }, [quizId]);

  function selectOption(questionId, option) {
    setAnswers((a) => ({ ...a, [questionId]: option }));
  }

  async function handleSubmit() {
    setError("");
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId: Number(questionId),
          selectedOption,
        })),
      };
      // Grading happens entirely server-side; we only receive the final score.
      const data = await api.post(`/quizzes/${quizId}/submit`, payload);
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!quiz) return <p>Loading...</p>;

  if (result) {
    return (
      <div className="card">
        <h2>Quiz submitted!</h2>
        <p>Your score: <strong>{result.score}%</strong></p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>{quiz.title}</h1>
      {quiz.questions.map((q) => (
        <div key={q.id} style={{ marginBottom: 16 }}>
          <p><strong>{q.question}</strong></p>
          {q.options.map((opt) => (
            <label key={opt} style={{ display: "block", fontWeight: 400 }}>
              <input
                type="radio"
                name={`q-${q.id}`}
                checked={answers[q.id] === opt}
                onChange={() => selectOption(q.id, opt)}
                style={{ width: "auto", marginRight: 8 }}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}
      <button onClick={handleSubmit}>Submit Quiz</button>
    </div>
  );
}
