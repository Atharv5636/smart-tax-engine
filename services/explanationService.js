function toNonNegativeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatCurrency(value) {
  const safeValue = toNonNegativeNumber(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function getTotalDeductions(existingDeductions = {}) {
  if (typeof existingDeductions === "number") {
    return toNonNegativeNumber(existingDeductions);
  }

  return (
    toNonNegativeNumber(existingDeductions.section80C ?? existingDeductions["80C"]) +
    toNonNegativeNumber(existingDeductions.section80D ?? existingDeductions["80D"]) +
    toNonNegativeNumber(existingDeductions.nps)
  );
}

function getOldRegimeBracket(taxableIncome) {
  const safeTaxableIncome = toNonNegativeNumber(taxableIncome);

  if (safeTaxableIncome <= 500000) {
    return "0% bracket";
  }

  if (safeTaxableIncome <= 1000000) {
    return "20% bracket";
  }

  return "30% bracket";
}

function getEstimatedSavingPer50k(bracket) {
  if (bracket === "20% bracket") {
    return 10000;
  }

  if (bracket === "30% bracket") {
    return 15000;
  }

  return 0;
}

function generateTaxExplanation({
  income,
  regime,
  oldTax,
  newTax,
  finalTax,
  existingDeductions,
  additionalBudget,
}) {
  const safeIncome = toNonNegativeNumber(income);
  const safeOldTax = toNonNegativeNumber(oldTax);
  const safeNewTax = toNonNegativeNumber(newTax);
  const safeFinalTax = toNonNegativeNumber(finalTax);
  const safeAdditionalBudget = toNonNegativeNumber(additionalBudget);
  const totalDeductions = getTotalDeductions(existingDeductions);
  const taxableIncome = Math.max(0, safeIncome - totalDeductions);
  const bracket = getOldRegimeBracket(taxableIncome);
  const deductionGap = Math.max(0, safeOldTax - safeNewTax);

  if (regime === "New") {
    const insights = [
      `Your estimated tax is ${formatCurrency(safeFinalTax)} under the New Regime.`,
      `Switching to Old Regime would increase your tax to ${formatCurrency(safeOldTax)}.`,
      `Your Old Regime taxable income falls in the ${bracket}.`,
    ];

    if (deductionGap > 0) {
      insights.push(
        `You would need approximately ${formatCurrency(deductionGap)} more deductions to make the Old Regime beneficial.`
      );
    }

    return {
      summary: "You are currently in the New Tax Regime, which minimizes your tax using lower slab rates.",
      reasoning: `Your total deductions of ${formatCurrency(totalDeductions)} are not high enough to offset the higher tax rates in the Old Regime.`,
      suggestion:
        "Additional investments under sections like 80C, 80D, or NPS will not reduce your tax under the New Regime.",
      insights,
    };
  }

  const savingComparedToNew = Math.max(0, safeNewTax - safeFinalTax);
  const estimatedSavingPer50k = getEstimatedSavingPer50k(bracket);

  return {
    summary: "The Old Tax Regime is beneficial for your profile due to effective use of deductions.",
    reasoning:
      "Your deductions significantly reduce your taxable income, lowering your overall tax liability.",
    suggestion: "Maximize investments under 80C, 80D, and NPS to further reduce tax.",
    insights: [
      `Your total deductions are ${formatCurrency(totalDeductions)}.`,
      `You are saving ${formatCurrency(savingComparedToNew)} compared to the New Regime.`,
      `Each additional ${formatCurrency(50000)} investment can reduce your tax by approximately ${formatCurrency(
        estimatedSavingPer50k
      )}.`,
      safeAdditionalBudget > 0
        ? `You have planned an additional investment budget of ${formatCurrency(safeAdditionalBudget)}.`
        : "Adding more investments can further improve your Old Regime efficiency.",
    ],
  };
}

module.exports = { generateTaxExplanation };
