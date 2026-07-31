const jwt = require("jsonwebtoken");

// Access token: short-lived, sent in Authorization header on every request.
// Payload carries ONLY what the server itself decides (id, role) — never
// trust a client-supplied role anywhere else in the codebase.
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
}

// Refresh token: longer-lived, stored ONLY in an httpOnly secure cookie
// (never localStorage), used solely to mint new access tokens.
function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, tokenVersion: user.token_version || 0 },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
