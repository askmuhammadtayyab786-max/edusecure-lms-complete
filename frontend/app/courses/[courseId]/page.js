"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/courses/${courseId}`).then(setCourse).catch((e) => setError(e.message));
  }, [courseId]);

  async function handleEnroll() {
    setError("");
    setMessage("");
    try {
      // The server re-validates role === 'student' and ownership rules —
      // this button being visible/hidden is a UX nicety only, not security.
      await api.post("/enrollments", { courseId: Number(courseId) });
      setMessage("Enrolled successfully!");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!course) return <p>Loading...</p>;

  return (
    <div className="card">
      <h1>{course.title}</h1>
      <p>{course.description}</p>
      {user?.role === "student" && <button onClick={handleEnroll}>Enroll</button>}
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
