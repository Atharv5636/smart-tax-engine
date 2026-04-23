const { optimizeTax } = require("../services/optimizerService");
const { calculateNewTax, calculateOldTax } = require("../services/taxService");
const { generateTaxExplanation } = require("../services/explanationService");

const DEDUCTION_LIMITS = {
  section80C: 150000,
  section80D: 25000,
  nps: 50000,
};

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toNonNegativeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeExistingDeductions(existingDeductions = {}) {
  return {
    section80C: Math.min(
      toNonNegativeNumber(existingDeductions.section80C),
      DEDUCTION_LIMITS.section80C
    ),
    section80D: Math.min(
      toNonNegativeNumber(existingDeductions.section80D),
      DEDUCTION_LIMITS.section80D
    ),
    nps: Math.min(toNonNegativeNumber(existingDeductions.nps), DEDUCTION_LIMITS.nps),
  };
}

function getTotalDeductions(existingDeductions = {}) {
  return (
    toNonNegativeNumber(existingDeductions.section80C) +
    toNonNegativeNumber(existingDeductions.section80D) +
    toNonNegativeNumber(existingDeductions.nps)
  );
}

function optimizeTaxAdvanced(req, res, next) {
  try {
    const { income, existingDeductions = {}, additionalBudget = req.body?.budget ?? 0 } = req.body;

    const normalizedExisting = normalizeExistingDeductions(existingDeductions);
    const totalDeductions = getTotalDeductions(normalizedExisting);
    const newTax = calculateNewTax(income);
    const oldTax = calculateOldTax(income, totalDeductions);
    // Backward-compatible field retained for current frontend behavior.
    const currentTax = oldTax;
    // Explicit semantics for consumers: baseline "current" tax before optimization.
    const baselineTax = oldTax;

    if (newTax <= oldTax) {
      const finalTax = newTax;
      const regime = "New";
      const taxSaved = Math.max(0, baselineTax - finalTax);
      const explanation = generateTaxExplanation({
        income,
        regime,
        oldTax,
        newTax,
        finalTax,
        existingDeductions: normalizedExisting,
        additionalBudget,
      });

      return res.status(200).json({
        success: true,
        data: {
          regime,
          oldTax,
          newTax,
          finalTax,
          taxSaved,
          currentTax,
          baselineTax,
          currentTaxOldRegime: oldTax,
          currentTaxNewRegime: newTax,
          ignoreDeductions: true,
          explanation,
        },
      });
    }

    const result = optimizeTax(income, normalizedExisting, additionalBudget);
    const finalTax = Math.max(0, Number(result.minimumTax || 0));
    const regime = "Old";
    const taxSaved = Math.max(0, baselineTax - finalTax);
    const explanation = generateTaxExplanation({
      income,
      regime,
      oldTax,
      newTax,
      finalTax,
      existingDeductions: result.optimizedDeductions || normalizedExisting,
      additionalBudget,
    });

    return res.status(200).json({
      success: true,
      data: {
        ...result,
        regime,
        oldTax,
        newTax,
        finalTax,
        taxSaved,
        currentTax,
        baselineTax,
        currentTaxOldRegime: oldTax,
        currentTaxNewRegime: newTax,
        ignoreDeductions: false,
        explanation,
      },
    });
  } catch (error) {
    const statusCode = error.message ? 400 : 500;
    return next(
      createHttpError(error.message || "Failed to optimize tax for advanced input", statusCode)
    );
  }
}

module.exports = {
  optimizeTaxAdvanced,
};
