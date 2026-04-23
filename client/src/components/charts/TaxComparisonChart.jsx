import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function TaxComparisonChart({ oldTax, newTax }) {
  const data = [
    { name: "Old Tax", value: oldTax },
    { name: "New Tax", value: newTax },
  ];

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Tax Comparison
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TaxComparisonChart;
