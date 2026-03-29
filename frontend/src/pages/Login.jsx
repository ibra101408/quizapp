import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleGoogleLogin = () => {
      // This forces a full page reload, which is REQUIRED for OAuth2
      window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token); // token stores here
      navigate("/");
    } catch (err) {
      setError("Invalid email or password.");
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
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-white/40 text-sm mb-8">Sign in to your host account</p>

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

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}
          
          <button onClick={handleGoogleLogin}>Login with Google</button>
          
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg shadow-violet-500/20"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
            <p className="text-center text-white/30 text-sm">
            No account?{" "}
            <span
                onClick={() => navigate("/Register")}
                className="text-violet-400 hover:text-violet-300 cursor-pointer transition"
            >
                <br/>
                Sign up
            </span>
            </p>
        </div>
      </div>
    </div>
  );
}

export default Login;