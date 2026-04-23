import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

function TaxChart({ data = [], loading = false }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Tax vs Deduction Trend</h2>
        <p className="mt-1 text-sm text-slate-600">
          Visualize how additional deductions can reduce your tax liability.
        </p>
      </div>

      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          Loading chart...
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis
                dataKey="deduction"
                tick={{ fill: "#475569", fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <YAxis tick={{ fill: "#475569", fontSize: 12 }} tickFormatter={formatNumber} />
              <Tooltip
                formatter={(value) => [`Rs ${formatNumber(value)}`, "Tax"]}
                labelFormatter={(value) => `Deduction: Rs ${formatNumber(value)}`}
              />
              <Line
                type="monotone"
                dataKey="tax"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 4, fill: "#4f46e5" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default TaxChart;
