"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/courses")
      .then((data) => setCourses(data.courses || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1>Available Courses</h1>
      {error && <p className="error">{error}</p>}
      {courses.map((c) => (
        <div key={c.id} className="card">
          <h3>{c.title}</h3>
          <p>{c.description}</p>
          <p style={{ fontSize: 13, color: "#666" }}>By {c.instructor_name}</p>
          <Link className="btn" href={`/courses/${c.id}`}>View Course</Link>
        </div>
      ))}
      {courses.length === 0 && !error && <p>No courses available yet.</p>}
    </div>
  );
}
