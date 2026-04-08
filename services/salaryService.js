function validateNumber(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    const error = new Error(`${fieldName} must be a non-negative number`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function calculateHRA(basicSalary, hra, rentPaid, isMetro) {
  const salary = validateNumber(basicSalary, "basicSalary");
  const actualHRA = validateNumber(hra, "hra");
  const rent = validateNumber(rentPaid, "rentPaid");

  const rentMinusTenPercent = Math.max(0, rent - salary * 0.1);
  const salaryPercentageLimit = (isMetro ? 0.5 : 0.4) * salary;

  const hraExemption = Math.max(
    0,
    Math.min(actualHRA, rentMinusTenPercent, salaryPercentageLimit)
  );

  return {
    basicSalary: salary,
    hra: actualHRA,
    rentPaid: rent,
    isMetro: Boolean(isMetro),
    hraExemption: Math.round(hraExemption),
      taxableHRA: Math.max(0, Math.round(hra - hraExemption)),
  };
}

module.exports = {
  calculateHRA,
};
