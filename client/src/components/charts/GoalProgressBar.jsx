function GoalProgressBar({ currentTax, optimizedTax, targetTax }) {
  const current = Number(currentTax) || 0;
  const optimized = Number(optimizedTax) || 0;
  const target = Number(targetTax) || 0;

  let progress = 0;

  if (current <= target) {
    progress = 100;
  } else {
    const totalGap = current - target;
    const closedGap = current - optimized;
    progress = totalGap > 0 ? (closedGap / totalGap) * 100 : 0;
  }

  const boundedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Goal Progress</p>
        <p className="text-xs font-semibold text-slate-700">{boundedProgress}%</p>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-200">
        <div
          className="h-3 rounded-full bg-green-500 transition-all"
          style={{ width: `${boundedProgress}%` }}
        />
      </div>
    </div>
  );
}

export default GoalProgressBar;
