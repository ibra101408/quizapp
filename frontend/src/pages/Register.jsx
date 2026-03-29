import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authService";

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await register(email, password);
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-lg font-bold">Q</div>
        <span className="text-lg font-semibold tracking-wide uppercase text-white/80">Quiz Builder</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-gray-900/60 border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-1">Create account</h1>
        <p className="text-white/40 text-sm mb-8">Sign up as a quiz host</p>

        <div className="flex flex-col gap-5">

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password || !confirmPassword}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg shadow-violet-500/20"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-white/30 text-sm">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-violet-400 hover:text-violet-300 cursor-pointer transition"
            >
              Sign in
            </span>
          </p>

        </div>
      </div>

    </div>
  );
}

export default Register;