const { optimizeForGoal } = require("../services/goalService");

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function optimizeGoal(req, res, next) {
  try {
    const { income, currentDeductions, targetTax } = req.body;
    const hasMissingField = income === undefined || targetTax === undefined;

    if (hasMissingField) {
      throw createHttpError("Income and targetTax are required for goal optimization", 400);
    }

    const parsedTargetTax = Number(targetTax);

    if (!Number.isFinite(parsedTargetTax) || parsedTargetTax < 0) {
      throw createHttpError("targetTax must be a number greater than or equal to 0", 400);
    }

    const safeCurrentDeductions = Number(currentDeductions || 0);
    const result = optimizeForGoal(income, safeCurrentDeductions, parsedTargetTax);

    return res.status(200).json({
      success: true,
      data: {
        currentTax: result.currentTax,
        optimizedTax: result.optimizedTax,
        requiredDeductions: result.requiredDeductions,
        goalAchieved: result.goalAchieved,
      },
    });
  } catch (error) {
    return next(createHttpError(error.message || "Failed to optimize tax goal", error.statusCode));
  }
}

module.exports = {
  optimizeGoal,
};
