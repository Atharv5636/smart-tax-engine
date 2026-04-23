function ResultCard({ title, value, hint, tone = "slate" }) {
  const toneClasses = {
    slate: {
      card: "border-slate-200 bg-white",
      accent: "bg-slate-700",
      title: "text-slate-600",
      value: "text-slate-900",
    },
    emerald: {
      card: "border-emerald-200 bg-emerald-50",
      accent: "bg-emerald-600",
      title: "text-emerald-700",
      value: "text-emerald-900",
    },
    blue: {
      card: "border-blue-200 bg-blue-50",
      accent: "bg-blue-600",
      title: "text-blue-700",
      value: "text-blue-900",
    },
  };
  const palette = toneClasses[tone] ?? toneClasses.slate;

  return (
    <article
      className={`relative overflow-hidden rounded-xl border p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${palette.card}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${palette.accent}`} />
      <p className={`pl-2 text-xs font-semibold uppercase tracking-wide ${palette.title}`}>{title}</p>
      <p className={`mt-2 pl-2 text-2xl font-bold ${palette.value}`}>{value}</p>
      {hint ? <p className="mt-1 text-sm text-slate-600">{hint}</p> : null}
    </article>
  );
}

export default ResultCard;
