async function startServer() {
  // Step 1: Pehle Vault se secrets load karo
  const { loadSecretsFromVault } = require("./config/vault");
  await loadSecretsFromVault();

  // Step 2: Ab baaqi sab kuch require karo (secrets ab process.env mein maujood hain)
  const express = require("express");
  const helmet = require("helmet");
  const cors = require("cors");
  const morgan = require("morgan");
  const cookieParser = require("cookie-parser");
  const { testConnection } = require("./config/db");
  const { errorHandler } = require("./middleware/errorHandler");
  const authRoutes = require("./routes/authRoutes");
  const courseRoutes = require("./routes/courseRoutes");
  const enrollmentRoutes = require("./routes/enrollmentRoutes");
  const quizRoutes = require("./routes/quizRoutes");
  const adminRoutes = require("./routes/adminRoutes");

  const app = express();

  // Security headers (STRIDE - Info Disclosure / Tampering baseline)
  app.use(helmet());

  // CORS locked to the known frontend origin only — not "*".
  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
      credentials: true, // required so the httpOnly refresh cookie is sent
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/api/auth", authRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/enrollments", enrollmentRoutes);
  app.use("/api/quizzes", quizRoutes);
  app.use("/api/admin", adminRoutes);

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  // Centralized error handler must be registered LAST.
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;

  try {
    await testConnection();
    app.listen(PORT, () => console.log(`EduSecure LMS API running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to connect to MySQL:", err.message);
    process.exit(1);
  }
}

startServer();

module.exports = {}; // placeholder export (app ab startServer() ke andar hai)
