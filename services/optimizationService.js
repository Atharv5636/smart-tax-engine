function optimizeDeductions(income, deductions = {}) {
  const max80C = 150000;
  const current80C = Math.max(0, Number(deductions.section80C || 0));
  const used80C = Math.min(current80C, max80C);
  const unused80C = Math.max(0, max80C - used80C);

  const suggestions = [];

  if (unused80C > 0) {
    suggestions.push({
      section: "80C",
      additionalAmountPossible: unused80C,
      recommendation:
        "Consider ELSS, PPF, EPF, life insurance premium, or principal repayment on home loan.",
    });
  }

  return {
    income: Number(income),
    deductions: {
      section80C: used80C,
    },
    limits: {
      section80C: max80C,
    },
    unused80C,
    suggestions,
  };
}

module.exports = {
  optimizeDeductions,
};
