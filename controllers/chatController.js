const { parseUserInput } = require("../services/aiParserService");
const { optimizeTax } = require("../services/optimizerService");
const { calculateNewTax, calculateOldTax } = require("../services/taxService");
const { generateTaxExplanation } = require("../services/explanationService");

function toNonNegativeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatRupees(value) {
  return `₹${toNonNegativeNumber(value).toLocaleString("en-IN")}`;
}

function normalizeExistingDeductions(deductions = {}) {
  return {
    section80C: toNonNegativeNumber(deductions.section80C),
    section80D: toNonNegativeNumber(deductions.section80D),
    nps: toNonNegativeNumber(deductions.nps),
  };
}

function normalizeContext(context = {}) {
  return {
    income: toNonNegativeNumber(context.income),
    deductions: normalizeExistingDeductions(context.deductions || {}),
  };
}

function getTotalDeductions(deductions = {}) {
  return (
    toNonNegativeNumber(deductions.section80C) +
    toNonNegativeNumber(deductions.section80D) +
    toNonNegativeNumber(deductions.nps)
  );
}

function hasIncomeSignal(text = "") {
  return /\b(income|earn|salary|ctc|annum|per\s+year|lpa|lakh)\b/i.test(text);
}

function has80CSignal(text = "") {
  return /\b(80c|elss|ppf|epf|life\s*insurance|invested)\b/i.test(text);
}

function has80DSignal(text = "") {
  return /\b(80d|health\s*insurance|medical\s*insurance)\b/i.test(text);
}

function hasNpsSignal(text = "") {
  return /\b(nps|national\s*pension)\b/i.test(text);
}

function mergeParsedWithContext(text, parsed, context) {
  const normalizedContext = normalizeContext(context);
  const parsedIncome = toNonNegativeNumber(parsed.income);
  const parsedDeductions = normalizeExistingDeductions(parsed.deductions || {});

  return {
    income: hasIncomeSignal(text) ? parsedIncome : normalizedContext.income,
    deductions: {
      section80C: has80CSignal(text)
        ? parsedDeductions.section80C
        : normalizedContext.deductions.section80C,
      section80D: has80DSignal(text)
        ? parsedDeductions.section80D
        : normalizedContext.deductions.section80D,
      nps: hasNpsSignal(text)
        ? parsedDeductions.nps
        : normalizedContext.deductions.nps,
    },
  };
}

function getProfileChanges(previousContext, mergedContext) {
  const prev = normalizeContext(previousContext);
  const merged = normalizeContext(mergedContext);
  const changes = [];

  if (merged.income && merged.income !== prev.income) {
    changes.push({
      field: "income",
      message: `Income updated to ${formatRupees(merged.income)}`,
    });
  }

  if (merged.deductions.section80C !== prev.deductions.section80C) {
    changes.push({
      field: "80C",
      message: `80C updated to ${formatRupees(merged.deductions.section80C)}`,
    });
  }

  if (merged.deductions.section80D !== prev.deductions.section80D) {
    changes.push({
      field: "80D",
      message: `80D updated to ${formatRupees(merged.deductions.section80D)}`,
    });
  }

  if (merged.deductions.nps !== prev.deductions.nps) {
    changes.push({
      field: "NPS",
      message: `NPS updated to ${formatRupees(merged.deductions.nps)}`,
    });
  }

  return changes;
}

function getNextQuestion(mergedContext) {
  const merged = normalizeContext(mergedContext);

  if (!merged.income) {
    return "What is your annual income?";
  }

  if (!merged.deductions.section80C) {
    return "Do you invest in 80C (ELSS, PPF, LIC)? It can reduce your tax.";
  }

  if (!merged.deductions.section80D) {
    return "Do you have health insurance? You can claim benefits under 80D.";
  }

  if (!merged.deductions.nps) {
    return "Do you invest in NPS? It provides additional tax savings.";
  }

  return null;
}

function estimateOldTax(income, deductions) {
  const total =
    toNonNegativeNumber(deductions.section80C) +
    toNonNegativeNumber(deductions.section80D) +
    toNonNegativeNumber(deductions.nps);

  return calculateOldTax(toNonNegativeNumber(income), total);
}

function buildAdvisorySuggestions(income, existingDeductions, regime = null) {
  const safeIncome = toNonNegativeNumber(income);
  const baseDeductions = {
    section80C: toNonNegativeNumber(existingDeductions.section80C),
    section80D: toNonNegativeNumber(existingDeductions.section80D),
    nps: toNonNegativeNumber(existingDeductions.nps),
  };
  const advice = [];
  const baseOldTax = estimateOldTax(safeIncome, baseDeductions);
  const remaining80C = Math.max(0, 150000 - baseDeductions.section80C);

  if (remaining80C > 20000) {
    const test = {
      ...baseDeductions,
      section80C: baseDeductions.section80C + remaining80C,
    };
    const newOldTax = estimateOldTax(safeIncome, test);
    const savings = Math.max(0, baseOldTax - newOldTax);

    advice.push({
      type: "80C",
      message: `Invest up to ${formatRupees(remaining80C)} more under 80C`,
      savings,
      roi: remaining80C ? savings / remaining80C : 0,
    });
  }

  if (!baseDeductions.section80D) {
    const add = 25000;
    const test = {
      ...baseDeductions,
      section80D: add,
    };
    const newOldTax = estimateOldTax(safeIncome, test);
    const savings = Math.max(0, baseOldTax - newOldTax);

    advice.push({
      type: "80D",
      message: "Consider health insurance under 80D",
      savings,
      roi: add ? savings / add : 0,
    });
  }

  if (!baseDeductions.nps) {
    const add = 50000;
    const test = {
      ...baseDeductions,
      nps: add,
    };
    const newOldTax = estimateOldTax(safeIncome, test);
    const savings = Math.max(0, baseOldTax - newOldTax);

    advice.push({
      type: "NPS",
      message: "NPS gives additional ₹50,000 deduction",
      savings,
      roi: add ? savings / add : 0,
    });
  }

  if (regime === "New") {
    advice.push({
      type: "regime",
      message:
        "Deductions don't reduce tax under New Regime. Consider Old Regime if you plan to invest.",
      savings: 0,
      roi: 0,
    });
  }

  advice.sort((first, second) => {
    if (second.savings !== first.savings) {
      return second.savings - first.savings;
    }
    return second.roi - first.roi;
  });

  return advice.slice(0, 3);
}

async function analyzeChatPrompt(req, res) {
  const { text, context = {} } = req.body || {};

  if (typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Unable to understand input",
    });
  }

  try {
    const parsed = await parseUserInput(text);
    const previousContext = normalizeContext(context);
    const mergedContext = mergeParsedWithContext(text, parsed, context);
    const changes = getProfileChanges(previousContext, mergedContext);
    const nextQuestion = getNextQuestion(mergedContext);
    const income = toNonNegativeNumber(mergedContext.income);
    const existingDeductions = normalizeExistingDeductions(mergedContext.deductions);
    const advice = income > 0 ? buildAdvisorySuggestions(income, existingDeductions) : [];

    if (income <= 0) {
      return res.status(200).json({
        success: true,
        data: {
          parsed: {
            income: toNonNegativeNumber(parsed.income),
            deductions: normalizeExistingDeductions(parsed.deductions || {}),
          },
          context: mergedContext,
          result: null,
          explanation: null,
          changes,
          nextQuestion,
          advice,
        },
      });
    }

    const optimization = optimizeTax(income, existingDeductions, 0);
    const totalExistingDeductions = getTotalDeductions(existingDeductions);
    const oldTax = calculateOldTax(income, totalExistingDeductions);
    const newTax = calculateNewTax(income);
    const regime = newTax <= oldTax ? "New" : "Old";
    const finalTax = regime === "New" ? newTax : toNonNegativeNumber(optimization.minimumTax);
    const regimeAwareAdvice = buildAdvisorySuggestions(income, existingDeductions, regime);

    const explanation = generateTaxExplanation({
      income,
      regime,
      oldTax,
      newTax,
      finalTax,
      existingDeductions: optimization.optimizedDeductions || existingDeductions,
      additionalBudget: 0,
    });

    return res.status(200).json({
      success: true,
      data: {
        parsed: {
          income,
          deductions: existingDeductions,
        },
        context: {
          income,
          deductions: existingDeductions,
        },
        result: {
          regime,
          finalTax,
          oldTax,
          newTax,
        },
        explanation,
        changes,
        nextQuestion,
        advice: regimeAwareAdvice,
      },
    });
  } catch {
    return res.status(400).json({
      success: false,
      message: "Unable to understand input",
    });
  }
}

module.exports = {
  analyzeChatPrompt,
};
