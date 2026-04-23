import { useMemo, useState } from "react";
import { optimizeTaxAdvanced } from "../api/taxApi";
import FormCard from "../components/FormCard";
import PageHeader from "../components/PageHeader";
import DecisionSummaryCards from "../components/DecisionSummaryCards";
import DeductionBreakdownCard from "../components/DeductionBreakdownCard";
import StrategyInsightBox from "../components/StrategyInsightBox";
import PdfUpload from "../components/PdfUpload";
import { formatCurrency, hasEmptyField, toNumber } from "../utils/format";
import { getStoredPdfExtraction, getStoredTaxInputs } from "../utils/persistedTaxState";

const DEDUCTION_CAPS = {
  section80C: 150000,
  section80D: 25000,
  nps: 50000,
};
const TOTAL_DEDUCTION_CAP =
  DEDUCTION_CAPS.section80C + DEDUCTION_CAPS.section80D + DEDUCTION_CAPS.nps;

function normalizeExistingDeductions(values = {}) {
  return {
    section80C: Math.min(DEDUCTION_CAPS.section80C, Math.max(0, Number(values.section80C || 0))),
    section80D: Math.min(DEDUCTION_CAPS.section80D, Math.max(0, Number(values.section80D || 0))),
    nps: Math.min(DEDUCTION_CAPS.nps, Math.max(0, Number(values.nps || 0))),
  };
}

function TaxPage() {
  const [income, setIncome] = useState(() => {
    const stored = getStoredTaxInputs();
    const storedIncome = toNumber(stored?.income);
    return String(Number.isFinite(storedIncome) && storedIncome > 0 ? storedIncome : 1200000);
  });
  const [existingDeductions, setExistingDeductions] = useState(() => {
    const extracted = getStoredPdfExtraction()?.result?.deductions || {};
    return normalizeExistingDeductions({
      section80C: extracted["80C"] ?? extracted.section80C,
      section80D: extracted["80D"] ?? extracted.section80D,
      nps: extracted.nps,
    });
  });
  const [additionalBudget, setAdditionalBudget] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const detectedTotal = useMemo(
    () => existingDeductions.section80C + existingDeductions.section80D + existingDeductions.nps,
    [existingDeductions]
  );

  const applyExtractedValues = (data = {}) => {
    setExistingDeductions(normalizeExistingDeductions({
      section80C: Number(data.deductions?.["80C"] || 0),
      section80D: Number(data.deductions?.["80D"] || 0),
      nps: Number(data.deductions?.["nps"] || 0),
    }));
  };

  const handleApplyExtractedData = async (safeIncome, safeDeductions) => {
    setIncome(String(Number(safeIncome || 0) > 0 ? Number(safeIncome) : 1200000));
    applyExtractedValues({
      deductions: {
        "80C": safeDeductions?.["80C"] ?? safeDeductions?.section80C,
        "80D": safeDeductions?.["80D"] ?? safeDeductions?.section80D,
        nps: safeDeductions?.nps,
      },
    });
  };

  const onSubmit = async () => {
    if (hasEmptyField([income, additionalBudget])) {
      setError("Please fill all fields.");
      return;
    }

    const numericIncome = toNumber(income);
    const numericAdditionalBudget = Math.max(0, toNumber(additionalBudget));
    const normalizedExisting = normalizeExistingDeductions(existingDeductions);
    const totalExisting =
      normalizedExisting.section80C + normalizedExisting.section80D + normalizedExisting.nps;

    if (
      !Number.isFinite(numericIncome) ||
      !Number.isFinite(numericAdditionalBudget) ||
      numericIncome <= 0 ||
      numericAdditionalBudget < 0
    ) {
      setError("Enter valid amounts. Annual income must be greater than 0.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const isFullyUtilized = totalExisting >= TOTAL_DEDUCTION_CAP;
      const shouldSkipOptimization = numericAdditionalBudget === 0;
      let fullyUtilizedMessage = "";

      if (isFullyUtilized) {
        fullyUtilizedMessage = "You have already fully utilized deduction limits";
      }
      const optimizationResponse = await optimizeTaxAdvanced({
        income: numericIncome,
        existingDeductions: normalizedExisting,
        additionalBudget: numericAdditionalBudget,
      });
      const optimizationData = optimizationResponse?.data?.data || {};
      const recommendedRegime = optimizationData.regime === "Old" ? "Old" : "New";
      const ignoreDeductions = Boolean(optimizationData.ignoreDeductions);
      const optimizedDeductions = normalizeExistingDeductions(
        optimizationData.optimizedDeductions || optimizationData.bestCombination || normalizedExisting
      );
      const additionalUsed = ignoreDeductions
        ? 0
        : Math.max(0, Number(optimizationData.additionalUsed || 0));
      const totalDeductions = ignoreDeductions
        ? totalExisting
        : optimizedDeductions.section80C + optimizedDeductions.section80D + optimizedDeductions.nps;
      const currentTax = Math.max(
        0,
        Number(
          optimizationData.baselineTax ??
            optimizationData.currentTaxOldRegime ??
            optimizationData.oldTax ??
            0
        )
      );
      const finalTax = Math.max(0, Number(optimizationData.finalTax || 0));
      const taxSaved = Math.max(
        0,
        Number(optimizationData.taxSaved ?? Math.max(0, currentTax - finalTax))
      );
      const showNewRegimeWarning = ignoreDeductions && numericAdditionalBudget > 0;
      const showLowDeductionBadge = ignoreDeductions;

      const regimeReason =
        recommendedRegime === "New"
          ? "New regime selected due to lower slab rates"
          : "Old regime selected due to effective use of deductions";

      const deductionReason =
        recommendedRegime === "New"
          ? "Deductions do not impact tax under this regime"
          : shouldSkipOptimization
            ? "Existing deductions were considered without additional allocation."
            : `Additional budget allocated as 80C ${formatCurrency(
                optimizedDeductions.section80C
              )}, 80D ${formatCurrency(optimizedDeductions.section80D)}, NPS ${formatCurrency(
                optimizedDeductions.nps
              )}.`;

      setResult({
        currentTax,
        finalTax,
        taxSaved,
        recommendedRegime,
        ignoreDeductions,
        optimizedDeductions,
        alreadyInvested: totalExisting,
        additionalUsed,
        totalDeductions,
        fullyUtilizedMessage,
        showLowDeductionBadge,
        showNewRegimeWarning,
        reasons: {
          regimeReason,
          deductionReason,
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const previewAdditionalBudget = Math.max(0, toNumber(additionalBudget));

  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-6 shadow-md">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-cyan-100 blur-3xl" />

      <div className="relative">
        <PageHeader
          title="Tax Decision Engine"
          description="This module analyzes your inputs and recommends the most tax-efficient strategy."
        />
        <div className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800">
          Intelligent Tax Strategy System
        </div>
      </div>

      <div className="relative mt-6 grid gap-6 lg:grid-cols-[minmax(320px,420px),1fr]">
        <FormCard title="Tax Inputs">
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Enter your financial details to get optimized tax strategy
          </p>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Annual Income</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="e.g. 1200000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              Additional Investment Budget (Optional)
            </span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="e.g. 200000"
              value={additionalBudget}
              onChange={(e) => setAdditionalBudget(Math.max(0, Number(e.target.value || 0)))}
            />
          </label>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Detected from Form 16
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <p>80C: <strong>{formatCurrency(existingDeductions.section80C)}</strong></p>
              <p>80D: <strong>{formatCurrency(existingDeductions.section80D)}</strong></p>
              <p>NPS: <strong>{formatCurrency(existingDeductions.nps)}</strong></p>
              <p>Total detected: <strong>{formatCurrency(detectedTotal)}</strong></p>
            </div>
          </section>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={onSubmit}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Analyzing your tax profile...
              </>
            ) : (
              "Analyze & Recommend"
            )}
          </button>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </FormCard>

        {loading ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-700" />
              <p className="text-lg font-semibold text-slate-900">Analyzing your tax profile...</p>
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-3 animate-pulse rounded bg-slate-200" />
              <div className="h-3 animate-pulse rounded bg-slate-200" />
              <div className="h-3 animate-pulse rounded bg-slate-200" />
            </div>
          </section>
        ) : result ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recommended Regime
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{result.recommendedRegime}</p>
              <p className="mt-1 text-sm text-slate-600">
                Final Tax: {formatCurrency(result.finalTax)} | Tax Saved: {formatCurrency(result.taxSaved)}
              </p>
              {result.showLowDeductionBadge ? (
                <span className="mt-3 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Low-deduction profile {'->'} New regime is better
                </span>
              ) : null}
            </section>

            {result.fullyUtilizedMessage ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {result.fullyUtilizedMessage}
              </p>
            ) : null}

            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-md">
              <p className="text-sm text-emerald-900">
                Current Tax: <strong>{formatCurrency(result.currentTax)}</strong>
              </p>
              <p className="mt-1 text-sm text-emerald-900">
                Final Tax: <strong>{formatCurrency(result.finalTax)}</strong>
              </p>
              <p className="mt-1 text-sm text-emerald-900">
                You Save: <strong>{formatCurrency(result.taxSaved)} {"\uD83C\uDF89"}</strong>
              </p>
            </section>

            {result.ignoreDeductions ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-sm text-blue-900 shadow-md">
                <p>Deductions are not applicable under the New Tax Regime.</p>
              </div>
            ) : (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md text-sm text-slate-700">
                <p>Already invested: <strong>{formatCurrency(result.alreadyInvested)}</strong></p>
                <p>Additional investment used: <strong>{formatCurrency(result.additionalUsed)}</strong></p>
                <p>Total deductions: <strong>{formatCurrency(result.totalDeductions)}</strong></p>
              </section>
            )}

            {result.showNewRegimeWarning ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Additional investments will not reduce tax in New Regime
              </p>
            ) : null}

            <DecisionSummaryCards
              currentTax={result.currentTax}
              optimizedTax={result.finalTax}
              savings={result.taxSaved}
            />

            <p className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-md">
              {"\uD83D\uDCA1"} Increasing deductions can reduce your tax significantly depending on your regime.
            </p>

            {result.ignoreDeductions ? null : (
              <DeductionBreakdownCard deductions={result.optimizedDeductions} totalBudget={previewAdditionalBudget} />
            )}

            <StrategyInsightBox reasons={result.reasons} />
          </div>
        ) : (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-md">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Decision Preview</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Your strategy engine is ready</h3>
              <p className="mt-1 text-sm text-slate-600">
                Press Analyze and get a recommendation with optimized tax, savings estimate, and deduction mix.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-800">Planned Deduction Allocation</p>
              <p className="mt-1 text-xs text-slate-500">Auto-prioritized to maximize old-regime efficiency</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">80C</p>
                  <p className="text-base font-semibold text-slate-900">
                    {formatCurrency(existingDeductions.section80C)}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">80D</p>
                  <p className="text-base font-semibold text-slate-900">
                    {formatCurrency(existingDeductions.section80D)}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">NPS</p>
                  <p className="text-base font-semibold text-slate-900">{formatCurrency(existingDeductions.nps)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-600">
                Additional budget: {formatCurrency(previewAdditionalBudget)} | Total detected:{" "}
                {formatCurrency(detectedTotal)}
              </p>
            </div>
          </section>
        )}
      </div>
      <PdfUpload onApplyExtractedData={handleApplyExtractedData} isCalculating={loading} />
    </section>
  );
}

export default TaxPage;


