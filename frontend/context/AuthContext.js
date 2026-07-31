"use client";
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { api, setAccessToken } from "../lib/api";

// IMPORTANT: `user.role` here is used only to decide what UI to SHOW
// (e.g. hide the "Create Course" button from a Student). It has ZERO
// security value on its own — every actual permission check happens
// server-side against the verified JWT (see backend/middleware/roles.js).
// A user editing this in devtools cannot gain any real access.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On page load there's no access token in memory yet (by design).
    // Try a silent refresh using the httpOnly cookie to restore the session.
    (async () => {
      const ok = await api.tryRefresh();
      if (ok) {
        try {
          // A lightweight "who am I" could be added server-side; for now
          // we rely on login/register to populate user state directly.
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  async function login(email, password) {
    const data = await api.post("/auth/login", { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }


   const register = useCallback(async (name, email, password) => {
    return api.post("/auth/register", { name, email, password });
   }, 
   []);

  async function logout() {
    await api.post("/auth/logout", {});
    setAccessToken(null);
    setUser(null);
  }
const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
