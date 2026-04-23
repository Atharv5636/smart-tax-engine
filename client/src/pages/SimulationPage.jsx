import { useEffect, useMemo, useRef, useState } from "react";
import { calculateNewTax, calculateOldTax, optimizeTaxAdvanced } from "../api/taxApi";
import FormCard from "../components/FormCard";
import PageHeader from "../components/PageHeader";
import AreaChartCard from "../components/charts/AreaChartCard";
import { formatCurrency, hasEmptyField, toNumber } from "../utils/format";

function toNonNegativeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getScenarioFromTaxes(label, deductions, oldTax, newTax) {
  const safeOldTax = toNonNegativeNumber(oldTax);
  const safeNewTax = toNonNegativeNumber(newTax);
  const regime = safeOldTax <= safeNewTax ? "Old" : "New";
  const tax = Math.min(safeOldTax, safeNewTax);

  return {
    label,
    deductions: toNonNegativeNumber(deductions),
    oldTax: safeOldTax,
    newTax: safeNewTax,
    regime,
    tax,
    note:
      regime === "New"
        ? "Deductions do not impact tax under the New Regime"
        : "Old regime benefits from deduction adjustments in this scenario.",
  };
}

function getOldRegimeScenario(label, deductions, oldTax) {
  const safeOldTax = toNonNegativeNumber(oldTax);

  return {
    label,
    deductions: toNonNegativeNumber(deductions),
    oldTax: safeOldTax,
    newTax: null,
    regime: "Old",
    tax: safeOldTax,
    note: "Forced Old Regime comparison mode.",
  };
}

function getColorClasses(variant) {
  if (variant === "best") {
    return "border-green-200 bg-green-50 text-green-900";
  }

  if (variant === "baseline") {
    return "border-slate-200 bg-slate-50 text-slate-900";
  }

  return "border-blue-200 bg-blue-50 text-blue-900";
}

function buildChartDeductions(maxDeduction) {
  const safeMax = Math.max(0, toNonNegativeNumber(maxDeduction));
  if (safeMax === 0) {
    return [0];
  }

  const pointCount = Math.min(6, Math.max(5, Math.floor(safeMax / 50000) + 1));
  const points = Array.from({ length: pointCount }, (_, index) =>
    Math.round((safeMax * index) / (pointCount - 1))
  );

  return Array.from(new Set(points)).sort((a, b) => a - b);
}

function getAverageSavingPer50k(dataPoints) {
  if (!Array.isArray(dataPoints) || dataPoints.length < 2) {
    return 0;
  }

  const savingsBySegment = [];

  for (let index = 1; index < dataPoints.length; index += 1) {
    const previous = dataPoints[index - 1];
    const current = dataPoints[index];
    const deductionDelta =
      toNonNegativeNumber(current.deductionAmount) -
      toNonNegativeNumber(previous.deductionAmount);
    const taxDelta = toNonNegativeNumber(previous.tax) - toNonNegativeNumber(current.tax);

    if (deductionDelta > 0) {
      savingsBySegment.push((taxDelta / deductionDelta) * 50000);
    }
  }

  if (savingsBySegment.length === 0) {
    return 0;
  }

  const average = savingsBySegment.reduce((sum, value) => sum + value, 0) / savingsBySegment.length;
  return Math.max(0, Math.round(average));
}

function buildInvestmentPlan({
  income,
  existingDeductions,
  newTax,
  oldTax,
  forceOldRegime,
  riskProfile,
}) {
  const safeIncome = toNonNegativeNumber(income);
  const safeExistingDeductions = toNonNegativeNumber(existingDeductions);
  const safeNewTax = toNonNegativeNumber(newTax);
  const safeOldTax = toNonNegativeNumber(oldTax);
  const isNewBetter = safeNewTax <= safeOldTax;
  const difference = Math.abs(safeOldTax - safeNewTax);

  const normalizedRisk = typeof riskProfile === "string" ? riskProfile.toLowerCase() : "moderate";
  const riskLabel =
    normalizedRisk === "conservative"
      ? "Conservative"
      : normalizedRisk === "aggressive"
      ? "Aggressive"
      : "Moderate";

  let allocation = "Equity 60%, Debt 30%, Gold 5%, Cash 5%";
  if (normalizedRisk === "conservative") {
    allocation = "Equity 40%, Debt 45%, Gold 10%, Cash 5%";
  } else if (normalizedRisk === "aggressive") {
    allocation = "Equity 80%, Debt 10%, Gold 5%, Cash 5%";
  }

  const header = isNewBetter
    ? "Investment Options (Return-focused)"
    : "Investment Options (Tax + Return balanced)";
  const reason = isNewBetter
    ? `New Regime is lower by ${formatCurrency(difference)}. Prioritize long-term returns over tax-only products.`
    : `Old Regime is lower by ${formatCurrency(difference)}. Mix tax-saving and growth instruments.`;

  const bullets = [
    `Risk profile selected: ${riskLabel}`,
    `Suggested allocation: ${allocation}`,
    "Build an emergency fund equal to 6 months of expenses before aggressive investing.",
    "Use low-cost diversified index funds for long-term equity exposure.",
    "Review allocation every 6 to 12 months and rebalance when needed.",
  ];

  if (safeIncome >= 2000000) {
    bullets.push("Keep a portion for goal-based satellite bets, but core portfolio should remain diversified.");
  } else if (safeIncome < 1000000) {
    bullets.push("Prioritize consistency via monthly SIPs and avoid over-concentrated positions.");
  }

  if (isNewBetter) {
    bullets.push("Prefer flexible investments over lock-in heavy tax-saving products.");
  } else {
    bullets.push(
      `Use deduction buckets strategically (current declared deductions: ${formatCurrency(
        safeExistingDeductions
      )}).`
    );
  }

  if (forceOldRegime) {
    bullets.push("This is a what-if Old Regime view; confirm final regime before financial year closure.");
  }

  const prompt = `Suggest a personalized ${riskLabel.toLowerCase()} investment plan for annual income ${safeIncome}, current deductions ${safeExistingDeductions}, old tax ${safeOldTax}, new tax ${safeNewTax}, with asset allocation and next 3 monthly actions.`;

  return {
    header,
    reason,
    bullets,
    prompt,
  };
}

async function calculateBreakEvenDeduction(income, existingDeductions, newTax) {
  let low = Math.max(0, Math.floor(toNonNegativeNumber(existingDeductions)));
  let high = low + 300000;
  let answer = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const oldTaxResponse = await calculateOldTax({ income, deductions: mid });
    const oldTaxAtMid = toNonNegativeNumber(oldTaxResponse?.data?.data?.oldTax);

    if (oldTaxAtMid <= newTax) {
      answer = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return answer;
}

function ExplanationCard({ explanation }) {
  if (!explanation) {
    return null;
  }

  return (
    <section className="rounded-xl border border-indigo-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-5 shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Smart Tax Insight</p>
      <h3 className="mt-1 text-lg font-bold text-slate-900">Smart Tax Insight</h3>
      <p className="mt-2 text-sm font-semibold text-slate-900">{explanation.summary}</p>

      <div className="mt-3 rounded-lg border border-blue-200 bg-white/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Why?</p>
        <p className="mt-1 text-sm text-slate-700">{explanation.reasoning}</p>
      </div>

      <div className="mt-3 rounded-lg border border-violet-200 bg-violet-100/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">What should you do?</p>
        <p className="mt-1 text-sm font-medium text-violet-900">{explanation.suggestion}</p>
      </div>

      {Array.isArray(explanation.insights) && explanation.insights.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Key Insights</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {explanation.insights.map((insight, index) => (
              <li key={`${insight}-${index}`}>{insight}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function SimulationPage() {
  const REGIME_PREF_KEY = "simulation_selected_regime";
  const RISK_PROFILE_PREF_KEY = "simulation_risk_profile";
  const [form, setForm] = useState({
    income: "1200000",
    existingDeductions: "100000",
    additionalInvestment: "50000",
    riskProfile: "moderate",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [forceOldRegime, setForceOldRegime] = useState(false);
  const [selectedRegime, setSelectedRegime] = useState("New");
  const [selectionMessage, setSelectionMessage] = useState("");
  const [showInvestmentOptions, setShowInvestmentOptions] = useState(false);
  const [investmentSectionHighlighted, setInvestmentSectionHighlighted] = useState(false);
  const investmentSectionRef = useRef(null);

  useEffect(() => {
    try {
      const savedRegime = window.localStorage.getItem(REGIME_PREF_KEY);
      if (savedRegime === "Old" || savedRegime === "New") {
        setSelectedRegime(savedRegime);
      }

      const savedRiskProfile = window.localStorage.getItem(RISK_PROFILE_PREF_KEY);
      if (savedRiskProfile === "conservative" || savedRiskProfile === "moderate" || savedRiskProfile === "aggressive") {
        setForm((previous) => ({ ...previous, riskProfile: savedRiskProfile }));
      }
    } catch {
      // Ignore storage failures (private mode, disabled storage, etc.)
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(REGIME_PREF_KEY, selectedRegime);
    } catch {
      // Ignore storage failures (private mode, disabled storage, etc.)
    }
  }, [selectedRegime]);

  useEffect(() => {
    try {
      window.localStorage.setItem(RISK_PROFILE_PREF_KEY, form.riskProfile);
    } catch {
      // Ignore storage failures (private mode, disabled storage, etc.)
    }
  }, [form.riskProfile]);

  const simulationChartData = useMemo(
    () =>
      (result?.chart || []).map((point) => ({
        deductions: point.deductionAmount,
        tax: point.tax,
      })),
    [result]
  );

  const investmentPlan = useMemo(
    () =>
      buildInvestmentPlan({
        income: toNumber(form.income),
        existingDeductions: toNumber(form.existingDeductions),
        newTax: result?.newTax,
        oldTax: result?.oldTax,
        forceOldRegime,
        riskProfile: form.riskProfile,
      }),
    [form.existingDeductions, form.income, form.riskProfile, forceOldRegime, result?.newTax, result?.oldTax]
  );

  const graphValidation = useMemo(() => {
    if (!Array.isArray(simulationChartData) || simulationChartData.length < 2) {
      return { isValid: true, issue: "" };
    }

    for (let index = 1; index < simulationChartData.length; index += 1) {
      const previous = toNonNegativeNumber(simulationChartData[index - 1].tax);
      const current = toNonNegativeNumber(simulationChartData[index].tax);

      if (current > previous) {
        return {
          isValid: false,
          issue: `Graph check failed at point ${index + 1}: tax increased from ${formatCurrency(
            previous
          )} to ${formatCurrency(current)}.`,
        };
      }
    }

    return { isValid: true, issue: "" };
  }, [simulationChartData]);

  const runSimulation = async (forceOld = false) => {
    if (hasEmptyField([form.income, form.existingDeductions])) {
      setError("Please fill all mandatory fields.");
      return;
    }

    const income = toNumber(form.income);
    const existingDeductions = Math.max(0, toNumber(form.existingDeductions));
    const additionalInvestment = Math.max(0, toNumber(form.additionalInvestment || 0));

    if (!Number.isFinite(income) || income <= 0) {
      setError("Annual income must be greater than 0.");
      return;
    }

    if (!Number.isFinite(existingDeductions) || !Number.isFinite(additionalInvestment)) {
      setError("Deductions and additional investment must be valid numbers.");
      return;
    }

    const scenarioCurrentDeductions = Math.min(income, existingDeductions);
    const scenarioInvestmentDeductions = Math.min(income, existingDeductions + additionalInvestment);

    try {
      setLoading(true);
      setError("");
      setResult(null);
      setForceOldRegime(forceOld);

      const optimizationResponse = await optimizeTaxAdvanced({
        income,
        existingDeductions: {
          section80C: existingDeductions,
          section80D: 0,
          nps: 0,
        },
        additionalBudget: additionalInvestment,
      });

      const optimizationData = optimizationResponse?.data?.data || {};
      if (!optimizationResponse?.data?.success) {
        throw new Error("Optimization API did not return success");
      }
      const isNewRegime = !forceOld && Boolean(optimizationData.ignoreDeductions);
      const currentTax = toNonNegativeNumber(
        optimizationData.baselineTax ??
          optimizationData.currentTaxOldRegime ??
          optimizationData.oldTax
      );
      const finalTax = toNonNegativeNumber(optimizationData.finalTax);
      const taxSaved = Math.max(0, currentTax - finalTax);
      const oldTax = toNonNegativeNumber(
        optimizationData.currentTaxOldRegime ?? optimizationData.oldTax ?? currentTax
      );
      const newTax = toNonNegativeNumber(
        optimizationData.currentTaxNewRegime ?? optimizationData.newTax ?? optimizationData.finalTax
      );
      let effectiveNewTax = newTax;
      const explanation = optimizationData.explanation || null;

      const optimizedDeductions = optimizationData?.optimizedDeductions || optimizationData?.bestCombination || {};
      const optimizedSum =
        toNonNegativeNumber(optimizedDeductions.section80C) +
        toNonNegativeNumber(optimizedDeductions.section80D) +
        toNonNegativeNumber(optimizedDeductions.nps);

      const scenarioMaxDeductions = forceOld
        ? Math.min(income, Math.max(scenarioInvestmentDeductions, 225000))
        : Math.min(income, Math.max(scenarioInvestmentDeductions, optimizedSum));

      let scenarios = [];
      let chartResponses = [];

      if (forceOld) {
        const [currentOldRes, investOldRes, maxOldRes, newTaxRes] = await Promise.all([
          calculateOldTax({ income, deductions: scenarioCurrentDeductions }),
          calculateOldTax({ income, deductions: scenarioInvestmentDeductions }),
          calculateOldTax({ income, deductions: scenarioMaxDeductions }),
          calculateNewTax({ income }),
        ]);
        effectiveNewTax = toNonNegativeNumber(newTaxRes?.data?.data?.newTax);

        scenarios = [
          getOldRegimeScenario(
            "Current Scenario",
            scenarioCurrentDeductions,
            currentOldRes?.data?.data?.oldTax
          ),
          getOldRegimeScenario(
            "With Investment",
            scenarioInvestmentDeductions,
            investOldRes?.data?.data?.oldTax
          ),
          getOldRegimeScenario(
            "Max Optimization",
            scenarioMaxDeductions,
            maxOldRes?.data?.data?.oldTax
          ),
        ];

        const chartDeductions = buildChartDeductions(
          Math.max(scenarioCurrentDeductions, scenarioInvestmentDeductions, scenarioMaxDeductions)
        );

        chartResponses = await Promise.all(
          chartDeductions.map(async (deductionAmount) => {
            const oldResponse = await calculateOldTax({ income, deductions: deductionAmount });
            const oldTaxValue = toNonNegativeNumber(oldResponse?.data?.data?.oldTax);

            return {
              deductionAmount,
              tax: oldTaxValue,
              regime: "Old",
            };
          })
        );
      } else {
        const [currentOldRes, currentNewRes, investOldRes, investNewRes, maxOldRes, maxNewRes] = await Promise.all([
          calculateOldTax({ income, deductions: scenarioCurrentDeductions }),
          calculateNewTax({ income }),
          calculateOldTax({ income, deductions: scenarioInvestmentDeductions }),
          calculateNewTax({ income }),
          calculateOldTax({ income, deductions: scenarioMaxDeductions }),
          calculateNewTax({ income }),
        ]);

        scenarios = [
          getScenarioFromTaxes(
            "Current Scenario",
            scenarioCurrentDeductions,
            currentOldRes?.data?.data?.oldTax,
            currentNewRes?.data?.data?.newTax
          ),
          getScenarioFromTaxes(
            "With Investment",
            scenarioInvestmentDeductions,
            investOldRes?.data?.data?.oldTax,
            investNewRes?.data?.data?.newTax
          ),
          getScenarioFromTaxes(
            "Max Optimization",
            scenarioMaxDeductions,
            maxOldRes?.data?.data?.oldTax,
            maxNewRes?.data?.data?.newTax
          ),
        ];

        const chartDeductions = buildChartDeductions(
          Math.max(scenarioCurrentDeductions, scenarioInvestmentDeductions, scenarioMaxDeductions)
        );

        chartResponses = await Promise.all(
          chartDeductions.map(async (deductionAmount) => {
            const [oldResponse, newResponse] = await Promise.all([
              calculateOldTax({ income, deductions: deductionAmount }),
              calculateNewTax({ income }),
            ]);
            const oldTaxValue = toNonNegativeNumber(oldResponse?.data?.data?.oldTax);
            const newTaxValue = toNonNegativeNumber(newResponse?.data?.data?.newTax);
            const regime = oldTaxValue <= newTaxValue ? "Old" : "New";

            return {
              deductionAmount,
              tax: Math.min(oldTaxValue, newTaxValue),
              regime,
            };
          })
        );
      }

      const bestScenario = scenarios.reduce((best, scenario) =>
        scenario.tax < best.tax ? scenario : best
      );

      const additionalSpend = Math.max(0, scenarioInvestmentDeductions - scenarioCurrentDeductions);
      const savingsFromInvestment = Math.max(0, scenarios[0].tax - scenarios[1].tax);
      const avgSavingPer50k = getAverageSavingPer50k(chartResponses);
      const isForcedOld = forceOld === true;
      const currentTaxForComparison = toNonNegativeNumber(scenarios[0].tax);
      const optimizedTax = toNonNegativeNumber(bestScenario.tax);
      let breakEvenDeduction = null;
      let additionalNeeded = null;
      if (isForcedOld) {
        breakEvenDeduction = await calculateBreakEvenDeduction(
          income,
          scenarioCurrentDeductions,
          effectiveNewTax
        );
        additionalNeeded =
          breakEvenDeduction !== null
            ? Math.max(0, breakEvenDeduction - scenarioCurrentDeductions)
            : null;
      }
      const forcedExplanation = {
        summary: "Under the Old Tax Regime, deductions reduce your taxable income and lower your tax liability.",
        reasoning:
          "As you increase deductions, your taxable income decreases, reducing the amount taxed in higher slabs.",
        suggestion: "Increase investments in 80C, 80D, and NPS to minimize tax.",
        insights: [
          `Your tax reduces from ${formatCurrency(currentTaxForComparison)} to ${formatCurrency(
            optimizedTax
          )} after maximizing deductions.`,
          "Each Rs 50,000 deduction significantly reduces tax",
        ],
      };
      const explanationToShow = isForcedOld ? forcedExplanation : explanation;

      if (isNewRegime) {
        setResult({
          isNewRegime: true,
          regime: "New",
          finalTax,
          taxSaved,
          decisionText:
            "You should stay in the New Tax Regime. Additional investments will NOT reduce your tax.",
          infoText: "You are in the New Tax Regime. Deductions do not reduce tax in this regime.",
          nextModeHint: "New regime uses lower slab rates but removes most deductions.",
          oldRegimeWhen:
            "Consider Old Regime when your eligible deductions are high enough to offset slab-rate differences.",
          badgeText: "Low-deduction profile -> New Regime is optimal",
          oldTax,
          newTax: effectiveNewTax,
          comparisonSavings: Math.max(0, oldTax - effectiveNewTax),
          scenarios,
          bestLabel: bestScenario.label,
          chart: chartResponses,
          insightText: `Every ${formatCurrency(50000)} increase in deductions reduces your tax by approximately ${formatCurrency(
            avgSavingPer50k
          )}`,
          explanation: explanationToShow,
        });
        return;
      }

      setResult({
        isNewRegime: false,
        regime: "Old",
        finalTax: bestScenario.tax,
        taxSaved: Math.max(0, scenarios[0].tax - bestScenario.tax),
        scenarios,
        bestLabel: bestScenario.label,
        decisionText: `Investing ${formatCurrency(additionalSpend)} more can reduce your tax by ${formatCurrency(
          savingsFromInvestment
        )}`,
        insightText: `Every ${formatCurrency(50000)} increase in deductions reduces your tax by approximately ${formatCurrency(
          avgSavingPer50k
        )}`,
        chart: chartResponses,
        explanation: explanationToShow,
        oldTax,
        newTax: effectiveNewTax,
        comparisonSavings: Math.max(0, oldTax - effectiveNewTax),
        currentTaxForComparison,
        optimizedTaxForComparison: optimizedTax,
        potentialOldSavings: Math.max(0, currentTaxForComparison - optimizedTax),
        breakEvenDeduction,
        additionalNeeded,
      });
    } catch (requestError) {
      const backendError = requestError?.response?.data?.error || requestError?.response?.data?.message;
      const runtimeError = requestError?.message;
      setError(backendError || runtimeError || "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    setSelectionMessage("");
    await runSimulation(false);
  };

  const handleForceOldRegime = async () => {
    setSelectionMessage("");
    await runSimulation(true);
  };

  const handleStayInNewRegime = async () => {
    setSelectedRegime("New");
    setSelectionMessage("New regime selected.");
    await runSimulation(false);
  };

  const handleSwitchToOldRegime = async () => {
    setSelectedRegime("Old");
    setSelectionMessage("Old regime what-if applied.");
    await runSimulation(true);
  };

  const isSimulationUseful = result && (!result.isNewRegime || forceOldRegime);

  const handleExploreInvestmentOptions = () => {
    setShowInvestmentOptions(true);
    setInvestmentSectionHighlighted(true);

    window.setTimeout(() => {
      investmentSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);

    window.setTimeout(() => {
      setInvestmentSectionHighlighted(false);
    }, 2000);
  };

  useEffect(() => {
    if (!result) {
      setShowInvestmentOptions(false);
      setInvestmentSectionHighlighted(false);
    }
  }, [result]);

  const handleCopyInvestmentPrompt = async () => {
    const prompt = investmentPlan.prompt;
    try {
      await navigator.clipboard.writeText(prompt);
      setSelectionMessage("Investment prompt copied. Paste it into Chat Assistant.");
    } catch {
      setSelectionMessage("Could not copy automatically. Use Chat Assistant with: " + prompt);
    }
  };

  const handleSeeTaxEfficientOptions = () => {
    setShowInvestmentOptions(true);
    setInvestmentSectionHighlighted(true);
    investmentSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      setInvestmentSectionHighlighted(false);
    }, 2000);
  };

  const investmentOptionsPanel = showInvestmentOptions ? (
    <div
      id="investment-section"
      ref={investmentSectionRef}
      className={`rounded-lg border p-4 text-sm text-slate-700 shadow-md transition ${
        investmentSectionHighlighted ? "border-indigo-400 bg-indigo-50" : "border-blue-200 bg-blue-50"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{investmentPlan.header}</p>
      <p className="mt-2 text-sm font-medium text-blue-900">{investmentPlan.reason}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {investmentPlan.bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopyInvestmentPrompt}
          className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          Copy Prompt for Chat Assistant
        </button>
      </div>
    </div>
  ) : null;

  return (
    <section>
      <PageHeader
        title="Scenario Analysis Engine"
        description="Simulate how changes in deductions affect your tax liability"
      />
      <FormCard title="Scenario Comparison Engine">
        <p className="text-sm text-slate-600">
          Simulate how changes in deductions affect your tax liability
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Annual Income</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Enter annual income"
            value={form.income}
            onChange={(event) => setForm({ ...form, income: event.target.value })}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Existing Deductions</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Enter existing deductions"
            value={form.existingDeductions}
            onChange={(event) => setForm({ ...form, existingDeductions: event.target.value })}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Additional Investment (Optional)</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Enter additional investment"
            value={form.additionalInvestment}
            onChange={(event) => setForm({ ...form, additionalInvestment: event.target.value })}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Risk Profile</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.riskProfile}
            onChange={(event) => setForm({ ...form, riskProfile: event.target.value })}
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </label>

        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800 disabled:opacity-50"
          disabled={loading}
          onClick={onSubmit}
        >
          {loading ? "Processing..." : "Run Scenario Comparison"}
        </button>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {selectionMessage ? <p className="text-sm text-emerald-700">{selectionMessage}</p> : null}

        {result ? (
          <div className="mt-4 space-y-4">
            {!isSimulationUseful ? (
              <>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Decision</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-900">
                    You are in the New Tax Regime. Deductions do not reduce your tax.
                  </p>
                  <p className="mt-1 text-sm font-medium text-emerald-800">{result.decisionText}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Comparison Proof</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Old Regime Tax</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(result.oldTax)}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">New Regime Tax</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(result.newTax)}</p>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-700">Savings</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-900">
                        {formatCurrency(result.comparisonSavings)}
                      </p>
                    </div>
                  </div>
                </div>

                <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final Output</p>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      Regime: New
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">Tax: {formatCurrency(result.finalTax)}</p>
                  <p className="mt-2 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {result.badgeText}
                  </p>
                  <p className="mt-3 text-sm font-medium text-emerald-700">
                    This recommendation minimizes your tax based on your current profile.
                  </p>
                </article>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-md">
                  <p className="inline-flex rounded-full border border-blue-300 bg-white px-2 py-1 text-xs font-semibold text-blue-700">
                    Why?
                  </p>
                  <p className="mt-2 text-sm text-blue-900">{result.nextModeHint}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    When should you consider Old Regime?
                  </p>
                  <p className="mt-1">{result.oldRegimeWhen}</p>
                </div>

                {investmentOptionsPanel}

                <ExplanationCard explanation={result.explanation} />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExploreInvestmentOptions}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Explore Investment Options
                  </button>
                  <button
                    type="button"
                    onClick={handleForceOldRegime}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Compare Old Regime Anyway
                  </button>
                </div>
              </>
            ) : (
              <>
                {forceOldRegime ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">Viewing Old Regime Analysis (What-if Scenario)</p>
                    <p className="mt-1">This shows how deductions impact tax under the Old Regime.</p>
                  </div>
                ) : null}

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">FINAL COMPARISON</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Old Regime (max optimized)</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatCurrency(result.optimizedTaxForComparison ?? result.finalTax)}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">New Regime Tax</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(result.newTax)}</p>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-700">Savings</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-900">
                        {formatCurrency(
                          Math.max(
                            0,
                            toNonNegativeNumber(result.optimizedTaxForComparison ?? result.finalTax) -
                              toNonNegativeNumber(result.newTax)
                          )
                        )}
                      </p>
                    </div>
                  </div>
                  {toNonNegativeNumber(result.newTax) <
                  toNonNegativeNumber(result.optimizedTaxForComparison ?? result.finalTax) ? (
                    <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                      <p>
                        New Regime saves{" "}
                        {formatCurrency(
                          toNonNegativeNumber(result.optimizedTaxForComparison ?? result.finalTax) -
                            toNonNegativeNumber(result.newTax)
                        )}{" "}
                        more
                      </p>
                      <p className="font-semibold">Recommendation: Stay in New Regime</p>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                      Old Regime becomes beneficial with deductions
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Decision</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-900">{result.decisionText}</p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-900 shadow-md">
                  Potential savings using Old Regime:{" "}
                  {formatCurrency(
                    result.potentialOldSavings ??
                      Math.max(
                        0,
                        toNonNegativeNumber(result.currentTaxForComparison) -
                          toNonNegativeNumber(result.optimizedTaxForComparison ?? result.finalTax)
                      )
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {result.scenarios.map((scenario, index) => {
                    const isBest = scenario.label === result.bestLabel;
                    const variant = isBest ? "best" : index === 0 ? "baseline" : "neutral";

                    return (
                      <article
                        key={scenario.label}
                        className={`rounded-xl border p-4 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${getColorClasses(
                          variant
                        )}`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide">{scenario.label}</p>
                        <p className="mt-2 text-2xl font-bold">Tax: {formatCurrency(scenario.tax)}</p>
                        <p className="mt-2 text-sm font-medium">Best Regime: {scenario.regime}</p>
                        <p className="mt-1 text-xs">Deductions considered: {formatCurrency(scenario.deductions)}</p>
                        {scenario.regime === "New" ? <p className="mt-2 text-xs">{scenario.note}</p> : null}
                      </article>
                    );
                  })}
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Insight</p>
                  <p className="mt-1 text-sm font-semibold text-blue-900">{result.insightText}</p>
                </div>

                {forceOldRegime ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Old Regime Tax vs Deductions
                  </p>
                ) : null}

                <AreaChartCard
                  title="Deduction Amount vs Tax"
                  data={simulationChartData}
                  xKey="deductions"
                  yKey="tax"
                  color="#0ea5e9"
                />

                {!graphValidation.isValid ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">
                    {graphValidation.issue}
                  </div>
                ) : null}

                <ExplanationCard explanation={result.explanation} />
                {investmentOptionsPanel}

                {(() => {
                  const oldTaxValue = toNonNegativeNumber(result.oldTax);
                  const newTaxValue = toNonNegativeNumber(result.newTax);
                  const difference = Math.abs(oldTaxValue - newTaxValue);
                  const isNewBetter = newTaxValue <= oldTaxValue;

                  return (
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Final Recommendation
                      </p>

                      <div className="mt-3 space-y-1 text-sm text-slate-800">
                        <p>
                          Old Regime Tax:{" "}
                          <span className="text-base font-bold">{formatCurrency(oldTaxValue)}</span>
                        </p>
                        <p>
                          New Regime Tax:{" "}
                          <span className="text-base font-bold">{formatCurrency(newTaxValue)}</span>
                        </p>
                        <p>
                          Savings Difference:{" "}
                          <span className={isNewBetter ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>
                            {formatCurrency(difference)} {isNewBetter ? "saved in New Regime" : "saved in Old Regime"}
                          </span>
                        </p>
                      </div>

                      <div
                        className={`mt-4 rounded-lg border p-4 ${
                          isNewBetter
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-emerald-200 bg-emerald-50 text-emerald-900"
                        }`}
                      >
                        <p className="text-lg font-bold">
                          {isNewBetter
                            ? "New Tax Regime is better for you"
                            : "Old Tax Regime is better for you"}
                        </p>
                        <p className={`mt-1 text-sm ${isNewBetter ? "text-rose-700" : "text-emerald-700"}`}>
                          {isNewBetter
                            ? `Switching to Old Regime increases your tax by ${formatCurrency(difference)}`
                            : `You save ${formatCurrency(difference)} by using deductions`}
                        </p>
                      </div>

                      {forceOldRegime && isNewBetter ? (
                        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">
                          Warning: Even after comparison, Old Regime is NOT beneficial for your profile.
                        </div>
                      ) : null}

                      {forceOldRegime && isNewBetter ? (
                        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                          <p className="font-semibold">Break-even Insight</p>
                          {result.additionalNeeded !== null ? (
                            <p className="mt-1">
                              You would need approximately {formatCurrency(result.additionalNeeded)} more in deductions
                              to make the Old Regime beneficial.
                            </p>
                          ) : (
                            <p className="mt-1">
                              Even with maximum deductions, Old Regime may not be beneficial.
                            </p>
                          )}
                        </div>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleStayInNewRegime}
                          disabled={loading}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                            selectedRegime === "New"
                              ? "bg-emerald-800 text-white"
                              : "bg-emerald-700 text-white hover:bg-emerald-800"
                          }`}
                        >
                          Stay in New Regime
                        </button>
                        <button
                          type="button"
                          onClick={handleSwitchToOldRegime}
                          disabled={loading}
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                            selectedRegime === "Old"
                              ? "border-blue-700 bg-blue-700 text-white"
                              : "border-blue-300 bg-white text-blue-700 hover:bg-blue-50"
                          }`}
                        >
                          Switch to Old Regime
                        </button>
                        <button
                          type="button"
                          onClick={handleSeeTaxEfficientOptions}
                          className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          Explore Investment Options
                        </button>
                      </div>
                    </section>
                  );
                })()}
              </>
            )}
          </div>
        ) : null}
      </FormCard>
    </section>
  );
}

export default SimulationPage;


