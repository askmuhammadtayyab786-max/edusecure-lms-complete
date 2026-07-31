const multer = require("multer");
const path = require("node:path");
const crypto = require("node:crypto");

// Threat model note (STRIDE - DoS / Info Disclosure):
// - Whitelist MIME types explicitly (no arbitrary executables).
// - Randomize filenames (never trust the original filename — path traversal).
// - Enforce a max size to prevent disk exhaustion.
const ALLOWED_MIME = new Set([
  "application/pdf",
  "video/mp4",
  "image/png",
  "image/jpeg",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || "uploads"),
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString("hex");
    cb(null, randomName + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 25) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
});

module.exports = { upload };
