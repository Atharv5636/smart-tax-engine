const CESS_RATE = 0.04;

const NEW_REGIME_STANDARD_DEDUCTION = 75000;
const NEW_REGIME_REBATE_LIMIT = 700000;

const OLD_REGIME_REBATE_LIMIT = 500000;

const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 600000, rate: 0.05 },
  { min: 600000, max: 900000, rate: 0.1 },
  { min: 900000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.2 },
  { min: 1500000, max: Infinity, rate: 0.3 },
];

const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.2 },
  { min: 1000000, max: Infinity, rate: 0.3 },
];

function toNonNegativeNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return parsed;
}

function calculateProgressiveTax(income, slabs) {
  let tax = 0;

  for (const slab of slabs) {
    if (income <= slab.min) {
      continue;
    }

    const upperLimit = slab.max === Infinity ? income : Math.min(income, slab.max);
    const taxableAmount = upperLimit - slab.min;

    if (taxableAmount > 0) {
      tax += taxableAmount * slab.rate;
    }
  }

  return tax;
}

function getSurchargeRate(income, regime) {
  if (income <= 5000000) {
    return 0;
  }

  if (income <= 10000000) {
    return 0.1;
  }

  if (income <= 20000000) {
    return 0.15;
  }

  if (income <= 50000000) {
    return 0.25;
  }

  return regime === "new" ? 0.25 : 0.37;
}

function applySurchargeAndCess(baseTax, income, regime) {
  if (baseTax <= 0) {
    return 0;
  }

  const surchargeRate = getSurchargeRate(income, regime);
  const surcharge = baseTax * surchargeRate;
  const taxAfterSurcharge = baseTax + surcharge;
  return Math.round(taxAfterSurcharge * (1 + CESS_RATE));
}

function calculateNewTax(income) {
  const grossIncome = toNonNegativeNumber(income);
  const taxableIncome = Math.max(0, grossIncome - NEW_REGIME_STANDARD_DEDUCTION);

  if (taxableIncome <= NEW_REGIME_REBATE_LIMIT) {
    return 0;
  }

  const baseTax = calculateProgressiveTax(taxableIncome, NEW_REGIME_SLABS);
  return applySurchargeAndCess(baseTax, grossIncome, "new");
}

function calculateOldTax(income, deductions) {
  const grossIncome = toNonNegativeNumber(income);
  const deductionAmount = toNonNegativeNumber(deductions);
  const taxableIncome = Math.max(0, grossIncome - deductionAmount);

  if (taxableIncome <= OLD_REGIME_REBATE_LIMIT) {
    return 0;
  }

  const baseTax = calculateProgressiveTax(taxableIncome, OLD_REGIME_SLABS);
  return applySurchargeAndCess(baseTax, grossIncome, "old");
}

module.exports = {
  calculateNewTax,
  calculateOldTax,
};
