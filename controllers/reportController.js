const { generateTaxReport } = require("../services/pdfService");

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function generateReport(req, res, next) {
  try {
    const payload = req.body || {};

    if (!payload.parsed || !payload.result) {
      throw createHttpError("Invalid report payload", 400);
    }

    return generateTaxReport(payload, res);
  } catch (error) {
    return next(createHttpError(error.message || "Failed to generate tax report", error.statusCode));
  }
}

module.exports = {
  generateReport,
};
