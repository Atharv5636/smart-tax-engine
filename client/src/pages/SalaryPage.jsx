import { useState } from "react";
import { calculateSalaryHra } from "../api/taxApi";
import FormCard from "../components/FormCard";
import PageHeader from "../components/PageHeader";
import useApiAction from "../hooks/useApiAction";
import { formatCurrency, hasEmptyField, toNumber } from "../utils/format";
import { getSalaryInsight } from "../utils/insights";

function SalaryPage() {
  const [form, setForm] = useState({
    basicSalary: "600000",
    hra: "300000",
    rentPaid: "240000",
    isMetro: true,
  });
  const { loading, error, result, run, setError } = useApiAction();

  const onSubmit = async () => {
    if (hasEmptyField([form.basicSalary, form.hra, form.rentPaid])) {
      setError("Please fill all fields.");
      return;
    }

    await run(() =>
      calculateSalaryHra({
        basicSalary: toNumber(form.basicSalary),
        hra: toNumber(form.hra),
        rentPaid: toNumber(form.rentPaid),
        isMetro: form.isMetro,
      })
    );
  };

  return (
    <section>
      <PageHeader
        title="Salary Structuring Engine"
        description="This module evaluates salary components and recommends the most tax-efficient HRA treatment."
      />
      <FormCard title="HRA Inputs">
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Enter basic salary in Rs"
          value={form.basicSalary}
          onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
        />
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Enter HRA in Rs"
          value={form.hra}
          onChange={(e) => setForm({ ...form, hra: e.target.value })}
        />
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Enter rent paid in Rs"
          value={form.rentPaid}
          onChange={(e) => setForm({ ...form, rentPaid: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isMetro}
            onChange={(e) => setForm({ ...form, isMetro: e.target.checked })}
          />
          Metro City
        </label>
        <button
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          disabled={loading}
          onClick={onSubmit}
        >
          {loading ? "Processing..." : "Calculate HRA"}
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
                HRA Benefit Applied
              </p>
              <p className="mt-1 text-sm font-medium text-green-800">
                Taxable Income Reduced by {formatCurrency(result.hraExemption)}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-slate-600">Insight</p>
              <p className="font-semibold text-blue-800">{getSalaryInsight(result)}</p>
            </div>

            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              <p className="font-semibold">Recommended Action</p>
              <p>Based on this analysis, maintain updated rent proof and salary breakup records to preserve HRA benefits.</p>
            </div>

            <div className="mt-4 space-y-1 text-xs text-slate-600">
              <p>
                <strong>HRA Exemption:</strong> {formatCurrency(result.hraExemption)}
              </p>
              <p>
                <strong>Taxable HRA:</strong> {formatCurrency(result.taxableHRA || 0)}
              </p>
            </div>
          </div>
        ) : null}
      </FormCard>
    </section>
  );
}

export default SalaryPage;
