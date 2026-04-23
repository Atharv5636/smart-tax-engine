import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0d1020] via-[#1e163f] to-[#2c1a54] px-4 py-8 text-slate-100 sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-8 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />

      <section className="relative mx-auto w-full max-w-6xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold tracking-wide text-cyan-200">Smart Tax Engine</p>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Sign Up
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Tax Intelligence Workspace</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            Plan Smarter, Compare Faster, Save More Tax
          </h1>
          <p className="mt-5 max-w-2xl text-sm text-slate-200 sm:text-base">
            Analyze regimes, run simulations, optimize deductions, parse Form 16 data, and generate decision-ready tax
            reports in one place.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              I Already Have an Account
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

export default HomePage;
