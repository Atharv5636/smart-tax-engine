import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#0f172a", "#94a3b8"];

function CapitalGainsPieChart({ taxableAmount, exemptAmount }) {
  const data = [
    { name: "Taxable", value: Math.max(0, taxableAmount) },
    { name: "Exempt", value: Math.max(0, exemptAmount) },
  ];

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Gain Distribution
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default CapitalGainsPieChart;
