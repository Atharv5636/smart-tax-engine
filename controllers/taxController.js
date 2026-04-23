const { calculateNewTax, calculateOldTax } = require("../services/taxService");

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toNonNegativeNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return parsed;
}

function normalizeDeductions(deductions) {
  if (deductions && typeof deductions === "object") {
    const deduction80C = toNonNegativeNumber(deductions["80C"] ?? deductions.section80C);
    const deduction80D = toNonNegativeNumber(deductions["80D"] ?? deductions.section80D);
    const deductionNps = toNonNegativeNumber(deductions.nps);
    return deduction80C + deduction80D + deductionNps;
  }

  return toNonNegativeNumber(deductions);
}

function calculateTax(req, res, next) {
  try {
    const { income, deductions = 0 } = req.body;
    const normalizedDeductions = normalizeDeductions(deductions);
    const newTax = calculateNewTax(income);
    const oldTax = calculateOldTax(income, normalizedDeductions);

    return res.status(200).json({
      success: true,
      data: {
        newTax,
        oldTax,
      },
    });
  } catch (error) {
    return next(createHttpError(error.message || "Failed to calculate tax", error.statusCode));
  }
}

function calculateOldTaxOnly(req, res, next) {
  try {
    const { income, deductions = 0 } = req.body;
    const normalizedDeductions = normalizeDeductions(deductions);
    const oldTax = calculateOldTax(income, normalizedDeductions);

    return res.status(200).json({
      success: true,
      data: {
        oldTax,
      },
    });
  } catch (error) {
    return next(createHttpError(error.message || "Failed to calculate old regime tax", error.statusCode));
  }
}

function calculateNewTaxOnly(req, res, next) {
  try {
    const { income } = req.body;
    const newTax = calculateNewTax(income);

    return res.status(200).json({
      success: true,
      data: {
        newTax,
      },
    });
  } catch (error) {
    return next(createHttpError(error.message || "Failed to calculate new regime tax", error.statusCode));
  }
}

module.exports = {
  calculateTax,
  calculateOldTaxOnly,
  calculateNewTaxOnly,
};
