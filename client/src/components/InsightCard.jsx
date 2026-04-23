function InsightCard({ text, tone = "green" }) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-900"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-green-200 bg-green-50 text-green-900";

  return <div className={`rounded-lg border p-3 text-sm font-medium ${toneClass}`}>{text}</div>;
}

export default InsightCard;
