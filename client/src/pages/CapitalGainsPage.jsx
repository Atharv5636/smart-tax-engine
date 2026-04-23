import { useState } from "react";
import { calculateCapitalGains } from "../api/taxApi";
import FormCard from "../components/FormCard";
import PageHeader from "../components/PageHeader";
import CapitalGainsPieChart from "../components/charts/CapitalGainsPieChart";
import useApiAction from "../hooks/useApiAction";
import { formatCurrency, hasEmptyField, toNumber } from "../utils/format";
import { getCapitalGainsInsight } from "../utils/insights";

function CapitalGainsPage() {
  const [form, setForm] = useState({
    gain: "200000",
    holdingPeriodMonths: "18",
  });
  const { loading, error, result, run, setError } = useApiAction();

  const taxableAmount = result ? Number(result.taxableGain) : 0;
  const exemptAmount = result ? Math.max(0, Number(form.gain) - taxableAmount) : 0;

  const onSubmit = async () => {
    if (hasEmptyField([form.gain, form.holdingPeriodMonths])) {
      setError("Please fill all fields.");
      return;
    }

    await run(() =>
      calculateCapitalGains({
        gain: toNumber(form.gain),
        holdingPeriodMonths: toNumber(form.holdingPeriodMonths),
      })
    );
  };

  return (
    <section>
      <PageHeader
        title="Investment Tax Engine"
        description="This module analyzes holding period logic and determines optimized tax treatment for gains."
      />
      <FormCard title="Capital Gains Inputs">
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Enter gain amount in Rs"
          value={form.gain}
          onChange={(e) => setForm({ ...form, gain: e.target.value })}
        />
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Enter holding period in months"
          value={form.holdingPeriodMonths}
          onChange={(e) => setForm({ ...form, holdingPeriodMonths: e.target.value })}
        />
        <button
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          disabled={loading}
          onClick={onSubmit}
        >
          {loading ? "Processing..." : "Calculate Capital Gains"}
        </button>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {result ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                System Analysis
              </p>
              <span className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                Rule-Based Engine
              </span>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Decision</p>
              <p className="mt-2 text-2xl font-bold text-green-900">
                {result.type === "LTCG" ? "LTCG Treatment Applied" : "STCG Treatment Applied"}
              </p>
              <p className="mt-1 text-sm font-medium text-green-800">
                Tax Liability: {formatCurrency(result.tax)}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-slate-600">Insight</p>
              <p className="font-semibold text-blue-800">{getCapitalGainsInsight(result)}</p>
            </div>

            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              <p className="font-semibold">Recommended Action</p>
              <p>Based on this analysis, time exits around holding-period thresholds to improve post-tax returns.</p>
            </div>

            <div className="mt-4 space-y-1 text-xs text-slate-600">
              <p>
                <strong>Taxable Gain:</strong> {formatCurrency(result.taxableGain)}
              </p>
              <p>
                <strong>Tax:</strong> {formatCurrency(result.tax)}
              </p>
            </div>

            <CapitalGainsPieChart taxableAmount={taxableAmount} exemptAmount={exemptAmount} />
          </div>
        ) : null}
      </FormCard>
    </section>
  );
}

export default CapitalGainsPage;
