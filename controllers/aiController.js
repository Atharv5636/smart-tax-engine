const { parseUserInput } = require("../services/aiParserService");

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function parseFinancialText(req, res, next) {
  try {
    const { text } = req.body || {};

    if (typeof text !== "string" || text.trim().length === 0) {
      throw createHttpError("text must be a non-empty string", 400);
    }

    const data = await parseUserInput(text);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(createHttpError(error.message || "Failed to parse financial text", error.statusCode));
  }
}

module.exports = {
  parseFinancialText,
};
