import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/taxApi";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      const response = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      const payload = response?.data?.data || {};
      if (!payload?.token) {
        throw new Error("Invalid login response");
      }

      window.localStorage.setItem("token", payload.token);
      window.localStorage.setItem("user", JSON.stringify(payload.user || {}));
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b1020] via-[#181c3a] to-[#2b2057] px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Welcome Back</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Log In</h1>
        <p className="mt-2 text-sm text-slate-300">Access your tax workspace and continue your planning.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-200">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:ring-cyan-500/30"
              placeholder="name@email.com"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:ring-cyan-500/30"
              placeholder="Enter your password"
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
            className="w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          New user?{" "}
          <Link to="/signup" className="font-semibold text-cyan-200 hover:text-cyan-100">
            Create account
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

export default LoginPage;
