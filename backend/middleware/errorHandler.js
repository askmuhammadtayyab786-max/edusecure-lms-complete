// Threat model note (STRIDE - Information Disclosure):
// Never leak stack traces or DB error details to the client in production.
function errorHandler(err, req, res, next) {
  console.error(err);
  const isProd = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    error: isProd ? "Internal server error" : err.message,
  });
}

module.exports = { errorHandler };
