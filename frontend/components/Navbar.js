"use client";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav>
      <Link href="/">EduSecure LMS</Link>
      <Link href="/">Courses</Link>

      {!user && (
        <>
          <span className="spacer" />
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </>
      )}

      {user && (
        <>
          {user.role === "student" && <Link href="/dashboard/student">My Dashboard</Link>}
          {user.role === "instructor" && <Link href="/dashboard/instructor">Instructor Dashboard</Link>}
          {user.role === "admin" && <Link href="/dashboard/admin">Admin Dashboard</Link>}
          <span className="spacer" />
          <span>Hi, {user.name}</span>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </nav>
  );
}
