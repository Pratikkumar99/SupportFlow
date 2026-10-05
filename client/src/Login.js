import { useState } from "react";

export default function Login({ onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      localStorage.setItem("token", data.token);

      onLogin(data.user);
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong");
    }
  }

  return (
    <div className="auth-page min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>

          <p className="mt-2 text-sm text-slate-400">
            Login to your SupportFlow account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500"
          >
            Login
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSignup}
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
