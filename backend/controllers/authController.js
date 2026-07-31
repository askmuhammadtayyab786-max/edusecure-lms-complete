const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const { logAction } = require("../utils/audit");

const REFRESH_COOKIE_OPTS = {
  httpOnly: true, // not readable by JS -> mitigates XSS token theft
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// STEP: Register — role is fixed to 'student' by default here.
// Instructor/Admin accounts are provisioned by an Admin only (see adminController),
// never self-selected at signup — closes an Elevation of Privilege gap.
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ error: "Valid name, email, and password (min 8 chars) required" });
    }

    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'student', NOW())",
      [name, email, passwordHash]
    );

    await logAction({ actorId: result.insertId, action: "REGISTER", resourceType: "user", resourceId: result.insertId, req });
    return res.status(201).json({ message: "Account created", userId: result.insertId });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const [rows] = await pool.execute(
      "SELECT id, name, email, password_hash, role, token_version FROM users WHERE email = ?",
      [email]
    );

    // Same generic error whether email doesn't exist or password is wrong —
    // avoids leaking which emails are registered.
    const genericError = () => res.status(401).json({ error: "Invalid email or password" });

    if (rows.length === 0) return genericError();
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return genericError();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
    await logAction({ actorId: user.id, action: "LOGIN", resourceType: "user", resourceId: user.id, req });

    return res.json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const [rows] = await pool.execute(
      "SELECT id, role, token_version FROM users WHERE id = ?",
      [decoded.sub]
    );
    if (rows.length === 0 || rows[0].token_version !== decoded.tokenVersion) {
      return res.status(401).json({ error: "Refresh token no longer valid" });
    }

    const accessToken = generateAccessToken(rows[0]);
    return res.json({ accessToken });
  } catch (err) {
  console.error("Refresh token error:", err.message);
  return res.status(401).json({ error: "Invalid refresh token" });
}
}

async function logout(req, res) {
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  return res.json({ message: "Logged out" });
}

module.exports = { register, login, refresh, logout };
