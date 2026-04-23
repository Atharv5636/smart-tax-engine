import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function SimulationTrendChart({ data }) {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Deduction vs Tax Trend
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="deductions" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Line type="monotone" dataKey="tax" stroke="#0f172a" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SimulationTrendChart;
