import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, saveSession } from "../api/client";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("doctor@hospital.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/staff/login", { email, password });
      saveSession(data.token, data.role);
      navigate("/doctor/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <h1 className="font-display text-2xl text-teal-700 mb-1 text-center">Doctor Login</h1>
        <p className="text-ink/50 text-sm text-center mb-6">Staff access only</p>
        <form onSubmit={handleSubmit} className="card p-6 space-y-3">
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className="input"
            type="password"
            placeholder="Password (seed default: doctor123)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Please wait..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
