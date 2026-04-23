import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/taxApi";

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      const response = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      const payload = response?.data?.data || {};
      if (!payload?.token) {
        throw new Error("Invalid registration response");
      }

      window.localStorage.setItem("token", payload.token);
      window.localStorage.setItem("user", JSON.stringify(payload.user || {}));
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f1224] via-[#1d1e3c] to-[#332162] px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200">Get Started</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Create Account</h1>
        <p className="mt-2 text-sm text-slate-300">Set up your account and start planning tax smarter.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-200">Full Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-fuchsia-300 focus:ring-fuchsia-500/30"
              placeholder="Your name"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-200">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-fuchsia-300 focus:ring-fuchsia-500/30"
              placeholder="name@email.com"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-fuchsia-300 focus:ring-fuchsia-500/30"
              placeholder="Create a password"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-rose-300/60 bg-rose-500/20 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-fuchsia-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-fuchsia-200 hover:text-fuchsia-100">
            Log in
          </Link>
        </p>
        <p className="mt-2 text-sm text-slate-300">
          <Link to="/" className="font-semibold text-slate-200 hover:text-white">
            Back to Home
          </Link>
        </p>
      </section>
    </main>
  );
}

export default SignupPage;
