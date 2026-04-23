function errorHandler(err, req, res, next) {
  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = err.message || "Internal server error";

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${message}`);

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
