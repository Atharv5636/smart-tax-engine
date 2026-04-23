import { formatCurrency } from "../utils/format";

function DeductionBreakdownCard({ deductions, totalBudget }) {
  const lines = [
    { key: "section80C", label: "80C", cap: 150000 },
    { key: "section80D", label: "80D", cap: 25000 },
    { key: "nps", label: "NPS", cap: 50000 },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Best Deduction Breakdown
        </h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Additional Budget: {formatCurrency(totalBudget)}
        </span>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {lines.map((line) => {
          const value = deductions[line.key];
          const percent = Math.min(100, Math.round((value / line.cap) * 100));

          return (
            <div key={line.key} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">{line.label}</span>
                <span className="font-semibold text-slate-900">{formatCurrency(value)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Utilization: {percent}% of allowed limit</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default DeductionBreakdownCard;
