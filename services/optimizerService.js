const { calculateOldTax } = require("./taxService");

const LIMITS = {
  section80C: 150000,
  section80D: 25000,
  nps: 50000,
};

function toNonNegativeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeExistingDeductions(existingDeductions = {}) {
  return {
    section80C: Math.min(toNonNegativeNumber(existingDeductions.section80C), LIMITS.section80C),
    section80D: Math.min(toNonNegativeNumber(existingDeductions.section80D), LIMITS.section80D),
    nps: Math.min(toNonNegativeNumber(existingDeductions.nps), LIMITS.nps),
  };
}

function getTotalDeduction(deductions = {}) {
  return (
    toNonNegativeNumber(deductions.section80C) +
    toNonNegativeNumber(deductions.section80D) +
    toNonNegativeNumber(deductions.nps)
  );
}

function optimizeTax(income, existingDeductions = {}, additionalBudget = 0) {
  const parsedIncome = Number(income);
  const parsedAdditionalBudget = Number(additionalBudget);

  if (!Number.isFinite(parsedIncome) || parsedIncome <= 0) {
    throw new Error("Income must be a positive number");
  }
  if (!Number.isFinite(parsedAdditionalBudget) || parsedAdditionalBudget < 0) {
    throw new Error("Additional budget must be a non-negative number");
  }

  const normalizedExisting = normalizeExistingDeductions(existingDeductions);
  const startingTotal = getTotalDeduction(normalizedExisting);
  const totalLimit = LIMITS.section80C + LIMITS.section80D + LIMITS.nps;
  const totalRemainingCapacity = Math.max(0, totalLimit - startingTotal);
  const additionalUsed = Math.min(parsedAdditionalBudget, totalRemainingCapacity);

  const optimizedDeductions = {
    ...normalizedExisting,
  };

  const additionalAllocation = {
    section80C: 0,
    section80D: 0,
    nps: 0,
  };

  let remainingBudget = additionalUsed;
  const allocationOrder = ["section80C", "nps", "section80D"];

  for (const section of allocationOrder) {
    if (remainingBudget <= 0) {
      break;
    }

    const remainingLimit = Math.max(0, LIMITS[section] - optimizedDeductions[section]);
    const allocation = Math.min(remainingBudget, remainingLimit);
    additionalAllocation[section] = allocation;
    optimizedDeductions[section] += allocation;
    remainingBudget -= allocation;
  }

  const totalDeduction = getTotalDeduction(optimizedDeductions);
  const minimumTax = calculateOldTax(parsedIncome, totalDeduction);
  const alreadyInvested = getTotalDeduction(normalizedExisting);
  const isFullyUtilized = alreadyInvested >= totalLimit;

  return {
    limits: LIMITS,
    existingDeductions: normalizedExisting,
    bestCombination: optimizedDeductions,
    optimizedDeductions,
    additionalAllocation,
    alreadyInvested,
    additionalBudget: parsedAdditionalBudget,
    additionalUsed,
    unusedAdditionalBudget: parsedAdditionalBudget - additionalUsed,
    isFullyUtilized,
    totalDeduction,
    minimumTax,
  };
}

module.exports = {
  optimizeTax,
};
