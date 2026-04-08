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

  return Math.round(tax);
}

function calculateNewTax(income) {
  const slabs = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 600000, rate: 0.05 },
    { min: 600000, max: 900000, rate: 0.1 },
    { min: 900000, max: 1200000, rate: 0.15 },
    { min: 1200000, max: 1500000, rate: 0.2 },
    { min: 1500000, max: Infinity, rate: 0.3 },
  ];

  return calculateProgressiveTax(income, slabs);
}

function calculateOldTax(income, deductions) {
  const taxableIncome = Math.max(0, income - deductions);
  const slabs = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 0.05 },
    { min: 500000, max: 1000000, rate: 0.2 },
    { min: 1000000, max: Infinity, rate: 0.3 },
  ];

  return calculateProgressiveTax(taxableIncome, slabs);
}

module.exports = {
  calculateNewTax,
  calculateOldTax,
};
