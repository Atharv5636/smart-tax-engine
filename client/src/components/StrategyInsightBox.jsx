function StrategyInsightBox({ reasons }) {
  const lines = [
    reasons?.regimeReason,
    reasons?.deductionReason,
  ].filter(Boolean);

  return (
    <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-800">Why this strategy?</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-amber-900">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

export default StrategyInsightBox;
