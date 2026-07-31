"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [staff, setStaff] = useState({ name: "", email: "", password: "", role: "instructor" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function loadData() {
    // Both routes are protected server-side by requireRole("admin") —
    // this page rendering is convenience, not the actual gate.
    api.get("/admin/users").then(setUsers).catch((e) => setError(e.message));
    api.get("/admin/audit-logs").then(setLogs).catch((e) => setError(e.message));
  }

  useEffect(loadData, []);

  async function handleCreateStaff(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/admin/staff", staff);
      setMessage(`${staff.role} account created`);
      setStaff({ name: "", email: "", password: "", role: "instructor" });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <div className="card">
        <h3>Create Instructor / Admin Account</h3>
        <form onSubmit={handleCreateStaff}>
          <label htmlFor="staff-name">Name</label>
          <input id="staff-name" value={staff.name} onChange={(e) => setStaff({ ...staff, name: e.target.value })} />
          <label htmlFor="staff-email">Email</label>
          <input id="staff-email" type="email" value={staff.email} onChange={(e) => setStaff({ ...staff, email: e.target.value })} />
          <label htmlFor="staff-password">Password</label>
          <input id="staff-password" type="password" value={staff.password} onChange={(e) => setStaff({ ...staff, password: e.target.value })} />
          <label htmlFor="staff-role">Role</label>
          <select id="staff-role" value={staff.role} onChange={(e) => setStaff({ ...staff, role: e.target.value })}>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
          {error && <p className="error">{error}</p>}
          {message && <p style={{ color: "green" }}>{message}</p>}
          <button type="submit">Create Account</button>
        </form>
      </div>

      <div className="card">
        <h3>Users ({users.length})</h3>
        {users.map((u) => (
          <p key={u.id} style={{ fontSize: 13 }}>{u.name} — {u.email} — <strong>{u.role}</strong></p>
        ))}
      </div>

      <div className="card">
        <h3>Recent Audit Log</h3>
        {logs.map((l) => (
          <p key={l.id} style={{ fontSize: 12, color: "#555" }}>
            [{new Date(l.created_at).toLocaleString()}] actor #{l.actor_id} — {l.action} — {l.resource_type} #{l.resource_id}
          </p>
        ))}
      </div>
    </div>
  );
}
