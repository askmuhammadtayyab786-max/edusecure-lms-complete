"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Both endpoints are scoped server-side to req.user.id — even if a
    // student edits the UI, they cannot fetch another student's data.
    Promise.all([api.get("/enrollments/me"), api.get("/quizzes/results/me")])
      .then(([e, r]) => {
        setEnrollments(e);
        setResults(r);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (!user) return <p>Please log in.</p>;

  return (
    <div>
      <h1>My Dashboard</h1>
      {error && <p className="error">{error}</p>}

      <h3>My Courses</h3>
      {enrollments.map((e) => (
        <div key={e.id} className="card">
          <Link href={`/courses/${e.course_id}`}>{e.title}</Link>
          <p style={{ fontSize: 12, color: "#666" }}>Enrolled {new Date(e.enrolled_at).toLocaleDateString()}</p>
        </div>
      ))}
      {enrollments.length === 0 && <p>You are not enrolled in any course yet.</p>}

      <h3>My Quiz Results</h3>
      {results.map((r) => (
        <div key={r.id} className="card">
          <strong>{r.quiz_title}</strong> — {r.score}%
        </div>
      ))}
      {results.length === 0 && <p>No quiz attempts yet.</p>}
    </div>
  );
}
