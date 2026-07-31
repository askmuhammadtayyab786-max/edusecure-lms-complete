"use client";
import { useState } from "react";
import { api } from "../../../lib/api";

export default function InstructorDashboard() {
  const [course, setCourse] = useState({ title: "", description: "" });
  const [courseMsg, setCourseMsg] = useState("");
  const [error, setError] = useState("");

  async function handleCreateCourse(e) {
    e.preventDefault();
    setError("");
    setCourseMsg("");
    try {
      // instructor_id is set server-side from the JWT — this form never
      // sends who the instructor is.
      const data = await api.post("/courses", course);
      setCourseMsg(`Course created (id: ${data.id})`);
      setCourse({ title: "", description: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Instructor Dashboard</h1>

      <div className="card">
        <h3>Create a Course</h3>
        <form onSubmit={handleCreateCourse}>
          <label htmlFor="course-title">Title</label>
       <input
       id="course-title"
       value={course.title}
       onChange={(e) => setCourse({ ...course, title: e.target.value })}
       required
      />
          <label htmlFor="course-description">Description</label>
         <textarea
        id="course-description"
        value={course.description}
            onChange={(e) => setCourse({ ...course, description: e.target.value })}
            rows={3}
          />
          {error && <p className="error">{error}</p>}
          {courseMsg && <p style={{ color: "green" }}>{courseMsg}</p>}
          <button type="submit">Create Course</button>
        </form>
      </div>

      <p style={{ fontSize: 13, color: "#666" }}>
        Quiz creation (with correct answers) is done via the API directly for
        now — this keeps correct answers out of any client-rendered form
        history. A dedicated authoring UI can be added once the core flow is
        validated.
      </p>
    </div>
  );
}
