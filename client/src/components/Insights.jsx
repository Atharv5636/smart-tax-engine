function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function Insights({ estimatedTax = 0, potentialSavings = 0, bestStrategy = "No strategy available" }) {
  return (
    <section className="rounded-2xl border border-white/15 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 p-6 text-white shadow-[0_12px_45px_rgba(79,70,229,0.25)] backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Tax Insights</h2>
          <p className="mt-1 text-sm text-blue-100">
            Snapshot of your current tax position and optimization potential.
          </p>
        </div>
        <a
          href="/optimize"
          className="rounded-xl border border-white/20 bg-black/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80"
        >
          Optimize Now
        </a>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/12 bg-white/5 p-4 backdrop-blur-md">
          <p className="text-xs uppercase tracking-wide text-blue-100">Estimated Tax</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(estimatedTax)}</p>
        </div>
        <div className="rounded-xl border border-white/12 bg-white/5 p-4 backdrop-blur-md">
          <p className="text-xs uppercase tracking-wide text-blue-100">Potential Savings</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(potentialSavings)}</p>
        </div>
        <div className="rounded-xl border border-white/12 bg-white/5 p-4 backdrop-blur-md">
          <p className="text-xs uppercase tracking-wide text-blue-100">Best Strategy</p>
          <p className="mt-2 text-sm font-semibold leading-6">{bestStrategy}</p>
        </div>
      </div>
    </section>
  );
}

export default Insights;
