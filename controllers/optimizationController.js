const { optimizeTax: optimizeTaxEngine } = require("../services/optimizerService");

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function optimizeTax(req, res, next) {
  try {
    const { income, deductions = {} } = req.body;
    const result = optimizeTaxEngine(income, deductions, 0);

    const section80CUsed = Number(result?.existingDeductions?.section80C || 0);
    const section80CLimit = Number(result?.limits?.section80C || 150000);
    const unused80C = Math.max(0, section80CLimit - section80CUsed);

    const suggestions =
      unused80C > 0
        ? [
            {
              section: "80C",
              additionalAmountPossible: unused80C,
              recommendation:
                "Consider ELSS, PPF, EPF, life insurance premium, or principal repayment on home loan.",
            },
          ]
        : [];

    return res.status(200).json({
      success: true,
      data: {
        income: Number(income),
        deductions: {
          section80C: section80CUsed,
        },
        limits: {
          section80C: section80CLimit,
        },
        unused80C,
        suggestions,
        // Keep richer optimizer payload for advanced UI use/debugging.
        optimization: result,
      },
    });
  } catch (error) {
    return next(createHttpError(error.message || "Failed to optimize deductions", error.statusCode));
  }
}

module.exports = {
  optimizeTax,
};
