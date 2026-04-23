import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function AreaChartCard({ title, data, xKey, yKey, color = "#22c55e" }) {
  const gradientId = `colorData-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-950 to-slate-900 p-4 text-slate-100 shadow-lg sm:p-5">
      <h4 className="mb-3 text-base font-semibold tracking-wide text-slate-100">{title}</h4>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={xKey} tick={{ fill: "#cbd5e1", fontSize: 12 }} axisLine={{ stroke: "#475569" }} />
            <YAxis tick={{ fill: "#cbd5e1", fontSize: 12 }} axisLine={{ stroke: "#475569" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0b1220",
                border: "1px solid #334155",
                borderRadius: "10px",
                color: "#e2e8f0",
              }}
              labelStyle={{ color: "#94a3b8" }}
              itemStyle={{ color: "#e2e8f0" }}
            />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={color}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AreaChartCard;
