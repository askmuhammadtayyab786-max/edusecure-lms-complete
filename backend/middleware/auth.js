const jwt = require("jsonwebtoken");

// Threat model note (STRIDE - Elevation of Privilege):
// This is the ONLY place `req.user` gets populated. Role and user id come
// exclusively from the verified, signed JWT — never from req.body, query
// params, or headers supplied by the client.
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
  console.error("Token verification error:", err.message);
  return res.status(401).json({ error: "Invalid or expired token" });
}
}

module.exports = { verifyToken };
