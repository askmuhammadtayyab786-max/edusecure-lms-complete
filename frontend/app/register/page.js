"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      // Note: this always creates a STUDENT account. Instructor/Admin
      // accounts can only be created by an existing Admin (see
      // dashboard/admin) — there is no role field here by design.
      await register(form.name, form.email, form.password);
      router.push("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2>Create a student account</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="register-name">Name</label>
        <input id="register-name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
        <label htmlFor="register-email">Email</label>
        <input id="register-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
        <label htmlFor="register-password">Password</label>
        <input id="register-password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? "Creating..." : "Register"}</button>
      </form>
    </div>
  );
}
