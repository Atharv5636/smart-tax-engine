import { useEffect, useState } from "react";
import { calculateNewTax, calculateOldTax, optimizeTax } from "../api/taxApi";
import FormCard from "../components/FormCard";
import PageHeader from "../components/PageHeader";
import useApiAction from "../hooks/useApiAction";
import { formatCurrency, toNumber } from "../utils/format";
import { getOptimizationInsight } from "../utils/insights";

function OptimizePage() {
  const [form, setForm] = useState({ income: "1200000", section80C: "90000" });
  const [fieldErrors, setFieldErrors] = useState({ income: "", section80C: "" });
  const [copyMessage, setCopyMessage] = useState("");
  const { loading, error, result, run, setError } = useApiAction();

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
    const nextErrors = { income: "", section80C: "" };
    const income = toNumber(form.income);
    const section80C = toNumber(form.section80C);

    if (!Number.isFinite(income) || income <= 0) {
      nextErrors.income = "Income must be greater than 0.";
    }

    if (!Number.isFinite(section80C) || section80C < 0) {
      nextErrors.section80C = "80C used cannot be negative.";
    } else if (section80C > 150000) {
      nextErrors.section80C = "For this optimizer, 80C used cannot exceed Rs 1,50,000.";
    }

    setFieldErrors(nextErrors);
    return !nextErrors.income && !nextErrors.section80C;
  };

  const onSubmit = async () => {
    setCopyMessage("");
    if (!validateInputs()) {
      setError("Please fix highlighted fields.");
      return;
    }

    await run(async () => {
      const income = toNumber(form.income);
      const section80CUsed = Math.max(0, toNumber(form.section80C));
      const optimizePayload = {
        income,
        deductions: { section80C: section80CUsed },
      };

      const optimizationResponse = await optimizeTax(optimizePayload);
      const optimizationData = optimizationResponse?.data?.data || {};
      const section80CLimit = Number(optimizationData?.limits?.section80C || 150000);

      const [currentTaxResponse, optimizedTaxResponse] = await Promise.all([
        calculateOldTax({ income, deductions: section80CUsed }),
        calculateOldTax({ income, deductions: section80CLimit }),
      ]);
      const newTaxResponse = await calculateNewTax({ income });

      const currentOldTax = Number(currentTaxResponse?.data?.data?.oldTax || 0);
      const optimizedOldTax = Number(optimizedTaxResponse?.data?.data?.oldTax || 0);
      const newRegimeTax = Number(newTaxResponse?.data?.data?.newTax || 0);
      const estimatedTaxReduction = Math.max(0, currentOldTax - optimizedOldTax);
      const recommendedRegime = newRegimeTax <= optimizedOldTax ? "New" : "Old";

      return {
        data: {
          data: {
            ...optimizationData,
            taxImpact: {
              currentOldTax,
              optimizedOldTax,
              newRegimeTax,
              estimatedTaxReduction,
              recommendedRegime,
            },
          },
        },
      };
    });
  };

  const handleCopySummary = async () => {
    if (!result) {
      return;
    }

    const section80CUsed = Number(result.deductions?.section80C || 0);
    const section80CLimit = Number(result.limits?.section80C || 150000);
    const unused80C = Number(result.unused80C || 0);
    const currentOldTax = Number(result.taxImpact?.currentOldTax || 0);
    const optimizedOldTax = Number(result.taxImpact?.optimizedOldTax || 0);
    const newRegimeTax = Number(result.taxImpact?.newRegimeTax || 0);
    const estimatedTaxReduction = Number(result.taxImpact?.estimatedTaxReduction || 0);
    const recommendedRegime = result.taxImpact?.recommendedRegime || "New";
    const finalTax = Math.min(optimizedOldTax, newRegimeTax);

    const summary = [
      "Optimize Summary",
      `Income: ${formatCurrency(toNumber(form.income))}`,
      `80C Used: ${formatCurrency(section80CUsed)} / ${formatCurrency(section80CLimit)}`,
      `Unused 80C: ${formatCurrency(unused80C)}`,
      `Current Old Tax: ${formatCurrency(currentOldTax)}`,
      `Optimized Old Tax: ${formatCurrency(optimizedOldTax)}`,
      `New Regime Tax: ${formatCurrency(newRegimeTax)}`,
      `Estimated 80C Tax Reduction: ${formatCurrency(estimatedTaxReduction)}`,
      `Final Recommended Regime: ${recommendedRegime}`,
      `Lower Tax Outcome: ${formatCurrency(finalTax)}`,
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
        title="Tax Optimization Engine"
        description="This module evaluates deduction utilization and recommends optimal allocation strategy."
      />
      <FormCard title="Optimization Inputs">
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
          max="150000"
          className={`w-full rounded border px-3 py-2 ${
            fieldErrors.section80C ? "border-red-400" : "border-slate-300"
          }`}
          placeholder="Enter used 80C amount in Rs"
          value={form.section80C}
          onChange={(e) => onFieldChange("section80C", e.target.value)}
        />
        <p className="text-xs text-slate-500">Only current 80C amount already invested/claimed.</p>
        {fieldErrors.section80C ? <p className="text-xs text-red-600">{fieldErrors.section80C}</p> : null}
        <button
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          disabled={loading}
          onClick={onSubmit}
        >
          {loading ? "Processing..." : "Optimize"}
        </button>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {copyMessage ? <p className="text-sm text-emerald-700">{copyMessage}</p> : null}
        {loading ? (
          <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-16 animate-pulse rounded bg-slate-100" />
            <div className="h-12 animate-pulse rounded bg-slate-100" />
            <div className="h-12 animate-pulse rounded bg-slate-100" />
          </div>
        ) : null}
        {result ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            {(() => {
              const section80CUsed = Number(result.deductions?.section80C || 0);
              const section80CLimit = Number(result.limits?.section80C || 150000);
              const additional80CPossible = Math.max(0, section80CLimit - section80CUsed);
              const estimatedTaxReduction = Number(result.taxImpact?.estimatedTaxReduction || 0);
              const effectivePer10k =
                additional80CPossible > 0
                  ? Math.round((estimatedTaxReduction / additional80CPossible) * 10000)
                  : 0;
              const optimizedOldTax = Number(result.taxImpact?.optimizedOldTax || 0);
              const newRegimeTax = Number(result.taxImpact?.newRegimeTax || 0);
              const recommendedRegime = result.taxImpact?.recommendedRegime || "New";
              const regimeGap = Math.abs(newRegimeTax - optimizedOldTax);

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
              <p className="mt-2 text-2xl font-bold text-green-900">
                {(result.unused80C || 0) > 0 ? "Increase 80C Allocation" : "80C Fully Optimized"}
              </p>
              <p className="mt-1 text-sm font-medium text-green-800">
                Unused 80C: {formatCurrency(result.unused80C)}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-slate-600">Insight</p>
              <p className="font-semibold text-blue-800">{getOptimizationInsight(result)}</p>
            </div>

            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              <p className="font-semibold">Recommended Action</p>
              <p>Based on this analysis, allocate incremental investments to ELSS, PPF, EPF, or insurance premiums.</p>
            </div>

            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <p className="font-semibold">Estimated Tax Impact (Old Regime)</p>
              <p className="mt-1">
                Current Old-Regime tax:{" "}
                <strong>{formatCurrency(result.taxImpact?.currentOldTax || 0)}</strong>
              </p>
              <p>
                If 80C is fully utilized:{" "}
                <strong>{formatCurrency(result.taxImpact?.optimizedOldTax || 0)}</strong>
              </p>
              <p className="mt-1 font-semibold">
                Estimated reduction: {formatCurrency(result.taxImpact?.estimatedTaxReduction || 0)}
              </p>
              <p className="mt-1">
                Effective saving per {formatCurrency(10000)} additional 80C:{" "}
                <strong>{formatCurrency(effectivePer10k)}</strong>
              </p>
            </div>

            <div
              className={`mt-4 rounded-lg border p-3 text-sm ${
                recommendedRegime === "New"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-blue-200 bg-blue-50 text-blue-900"
              }`}
            >
              <p className="font-semibold">Regime Recommendation (after 80C optimization)</p>
              <p className="mt-1">
                Optimized Old Regime Tax: <strong>{formatCurrency(optimizedOldTax)}</strong>
              </p>
              <p>
                New Regime Tax: <strong>{formatCurrency(newRegimeTax)}</strong>
              </p>
              <p className="mt-1 font-semibold">
                Recommendation: Stay in {recommendedRegime} Regime{" "}
                {regimeGap > 0 ? `(${formatCurrency(regimeGap)} lower tax)` : "(taxes are equal)"}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
              <p className="font-semibold">Why this recommendation?</p>
              <p className="mt-1">
                We compare two outcomes and pick the lower tax:
                <br />
                <strong>
                  Final Tax = min(Optimized Old Tax, New Regime Tax) = min(
                  {formatCurrency(optimizedOldTax)}, {formatCurrency(newRegimeTax)})
                </strong>
              </p>
            </div>

            <div className="mt-4 space-y-1 text-xs text-slate-600">
              <p>
                <strong>80C Used:</strong> {formatCurrency(result.deductions?.section80C || 0)}
              </p>
              <p>
                <strong>80C Limit:</strong> {formatCurrency(result.limits?.section80C || 0)}
              </p>
            </div>
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

export default OptimizePage;
