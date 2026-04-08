const { calculateOldTax } = require("./taxService");

function optimizeForGoal(income, currentDeductions, targetTax) {
  const stepSize = 10000;
  const safeIncome = Number(income);
  const baseDeductions = Math.max(0, Number(currentDeductions));
  const desiredTax = Math.max(0, Number(targetTax));

  const currentTax = calculateOldTax(safeIncome, baseDeductions);
  let requiredDeductions = baseDeductions;
  let optimizedTax = currentTax;

  const plan = [
    {
      deductions: requiredDeductions,
      tax: optimizedTax,
    },
  ];

  while (optimizedTax > desiredTax && requiredDeductions < safeIncome) {
    requiredDeductions = Math.min(requiredDeductions + stepSize, safeIncome);
    optimizedTax = calculateOldTax(safeIncome, requiredDeductions);
    plan.push({
      deductions: requiredDeductions,
      tax: optimizedTax,
    });
  }

  return {
    currentTax,
    targetTax: desiredTax,
    optimizedTax,
    requiredDeductions,
    additionalDeductionsRequired: Math.max(0, requiredDeductions - baseDeductions),
    goalAchieved: optimizedTax <= desiredTax,
    stepSize,
    plan,
  };
}

module.exports = {
  optimizeForGoal,
};
