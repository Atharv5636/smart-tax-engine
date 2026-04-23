import { useEffect, useState } from "react";
import { optimizeGoal } from "../api/taxApi";
import FormCard from "../components/FormCard";
import PageHeader from "../components/PageHeader";
import AreaChartCard from "../components/charts/AreaChartCard";
import useApiAction from "../hooks/useApiAction";
import { formatCurrency, toNumber } from "../utils/format";
import { getGoalInsight } from "../utils/insights";

function GoalPage() {
  const [form, setForm] = useState({
    income: "1200000",
    currentDeductions: "100000",
    targetTax: "90000",
  });
  const [fieldErrors, setFieldErrors] = useState({
    income: "",
    currentDeductions: "",
    targetTax: "",
  });
  const [copyMessage, setCopyMessage] = useState("");
  const { loading, error, result, run, setError } = useApiAction();
  const goalChartData = result
    ? [
        { phase: "Current Tax", tax: result.currentTax },
        { phase: "Optimized Tax", tax: result.optimizedTax },
      ]
    : [];

  useEffect(() => {
    if (!copyMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyMessage("");
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyMessage]);

  const onFieldChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const validateInputs = () => {
    const nextErrors = {
      income: "",
      currentDeductions: "",
      targetTax: "",
    };

    const income = toNumber(form.income);
    const currentDeductions = toNumber(form.currentDeductions);
    const targetTax = toNumber(form.targetTax);

    if (!Number.isFinite(income) || income <= 0) {
      nextErrors.income = "Income must be greater than 0.";
    }

    if (!Number.isFinite(currentDeductions) || currentDeductions < 0) {
      nextErrors.currentDeductions = "Current deductions cannot be negative.";
    } else if (Number.isFinite(income) && currentDeductions > income) {
      nextErrors.currentDeductions = "Current deductions cannot exceed income.";
    }

    if (!Number.isFinite(targetTax) || targetTax < 0) {
      nextErrors.targetTax = "Target tax must be a non-negative number.";
    }

    setFieldErrors(nextErrors);
    return !nextErrors.income && !nextErrors.currentDeductions && !nextErrors.targetTax;
  };

  const onSubmit = async () => {
    setCopyMessage("");
    if (!validateInputs()) {
      setError("Please fix highlighted fields.");
      return;
    }

    const payload = {
      income: toNumber(form.income),
      currentDeductions: toNumber(form.currentDeductions),
      targetTax: toNumber(form.targetTax),
    };

    await run(async () => {
      const response = await optimizeGoal(payload);
      const data = response?.data?.data || {};

      return {
        data: {
          data: {
            ...data,
            targetTax: payload.targetTax,
            currentDeductionsSubmitted: payload.currentDeductions,
          },
        },
      };
    });
  };

  const handleCopySummary = async () => {
    if (!result) {
      return;
    }

    const summary = [
      "Goal Planner Summary",
      `Income: ${formatCurrency(toNumber(form.income))}`,
      `Current Deductions: ${formatCurrency(toNumber(form.currentDeductions))}`,
      `Target Tax: ${formatCurrency(result.targetTax ?? toNumber(form.targetTax))}`,
      `Current Tax: ${formatCurrency(result.currentTax)}`,
      `Optimized Tax: ${formatCurrency(result.optimizedTax)}`,
      `Required Deductions: ${formatCurrency(result.requiredDeductions)}`,
      `Goal Status: ${result.goalAchieved ? "Goal Achieved" : "Goal Revision Needed"}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setError("");
      setCopyMessage("Summary copied to clipboard.");
    } catch {
      setError("Could not copy summary. Please copy manually.");
      setCopyMessage("");
    }
  };

  return (
    <section>
      <PageHeader
        title="Goal-Based Tax Planner"
        description="This module analyzes target outcomes and determines if your tax goal is realistically achievable."
      />
      <FormCard title="Goal Inputs">
        <input
          type="number"
          min="0"
          className={`w-full rounded border px-3 py-2 ${
            fieldErrors.income ? "border-red-400" : "border-slate-300"
          }`}
          placeholder="Enter income in Rs"
          value={form.income}
          onChange={(e) => onFieldChange("income", e.target.value)}
        />
        <p className="text-xs text-slate-500">Annual gross income in rupees.</p>
        {fieldErrors.income ? <p className="text-xs text-red-600">{fieldErrors.income}</p> : null}
        <input
          type="number"
          min="0"
          className={`w-full rounded border px-3 py-2 ${
            fieldErrors.currentDeductions ? "border-red-400" : "border-slate-300"
          }`}
          placeholder="Enter current deductions in Rs"
          value={form.currentDeductions}
          onChange={(e) => onFieldChange("currentDeductions", e.target.value)}
        />
        <p className="text-xs text-slate-500">Current total deductions already available.</p>
        {fieldErrors.currentDeductions ? (
          <p className="text-xs text-red-600">{fieldErrors.currentDeductions}</p>
        ) : null}
        <input
          type="number"
          min="0"
          className={`w-full rounded border px-3 py-2 ${
            fieldErrors.targetTax ? "border-red-400" : "border-slate-300"
          }`}
          placeholder="Enter target tax in Rs"
          value={form.targetTax}
          onChange={(e) => onFieldChange("targetTax", e.target.value)}
        />
        <p className="text-xs text-slate-500">Tax amount you want to achieve after optimization.</p>
        {fieldErrors.targetTax ? <p className="text-xs text-red-600">{fieldErrors.targetTax}</p> : null}
        <button
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          disabled={loading}
          onClick={onSubmit}
        >
          {loading ? "Processing..." : "Plan Goal"}
        </button>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {copyMessage ? <p className="text-sm text-emerald-700">{copyMessage}</p> : null}
        {loading ? (
          <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-16 animate-pulse rounded bg-slate-100" />
            <div className="h-12 animate-pulse rounded bg-slate-100" />
            <div className="h-32 animate-pulse rounded bg-slate-100" />
          </div>
        ) : null}
        {result ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            {(() => {
              const currentDeductions = Number(
                result.currentDeductionsSubmitted ?? toNumber(form.currentDeductions)
              );
              const requiredDeductions = Number(result.requiredDeductions || 0);
              const additionalNeeded = Math.max(0, requiredDeductions - currentDeductions);
              const difficulty =
                additionalNeeded <= 50000 ? "Easy" : additionalNeeded <= 150000 ? "Medium" : "Hard";
              const difficultyClasses =
                difficulty === "Easy"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : difficulty === "Medium"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-rose-200 bg-rose-50 text-rose-800";

              return (
                <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                System Analysis
              </p>
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                  Rule-Based Engine
                </span>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  disabled={loading || !result}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Preparing..." : "Copy Summary"}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Decision</p>
              <p className="mt-2 text-3xl font-bold text-green-900">
                {result.goalAchieved ? "Goal Achieved" : "Goal Revision Needed"}
              </p>
              <p className="mt-1 text-sm font-medium text-green-800">
                Required Deductions: {formatCurrency(result.requiredDeductions)}
              </p>
              <p className="mt-1 text-sm font-medium text-green-800">
                Additional Deductions Needed: {formatCurrency(additionalNeeded)}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${difficultyClasses}`}
              >
                Difficulty: {difficulty}
              </span>
            </div>

            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-slate-600">Insight</p>
              <p className="font-semibold text-blue-800">{getGoalInsight(result)}</p>
            </div>

            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              <p className="font-semibold">Recommended Action</p>
              <p>Based on this analysis, increase deductions in phases and re-evaluate the target after each phase.</p>
            </div>

            <div className="mt-4 space-y-1 text-xs text-slate-600">
              <p>
                <strong>Current Tax:</strong> {formatCurrency(result.currentTax)}
              </p>
              <p>
                <strong>Optimized Tax:</strong> {formatCurrency(result.optimizedTax)}
              </p>
              <p>
                <strong>Required Deductions:</strong> {formatCurrency(result.requiredDeductions)}
              </p>
              <p>
                <strong>Additional Deductions Needed:</strong> {formatCurrency(additionalNeeded)}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
              <p className="font-semibold">Why this recommendation?</p>
              <p className="mt-1">
                Goal is achieved when <strong>Optimized Tax &lt;= Target Tax</strong>.
              </p>
              <p className="mt-1">
                Check: {formatCurrency(result.optimizedTax)} &lt;= {formatCurrency(result.targetTax ?? toNumber(form.targetTax))}{" "}
                = <strong>{result.goalAchieved ? "True" : "False"}</strong>
              </p>
            </div>

            <AreaChartCard
              title="Goal Progress Trend"
              data={goalChartData}
              xKey="phase"
              yKey="tax"
              color={result.goalAchieved ? "#22c55e" : "#ef4444"}
            />

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Disclaimer: These are estimated values for planning support and not financial advice.
            </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </FormCard>
    </section>
  );
}

export default GoalPage;
