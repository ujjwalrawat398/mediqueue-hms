import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, saveSession } from "../api/client";

export default function PatientAuth() {
  const { hospitalSlug } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = mode === "register" ? "/auth/patient/register" : "/auth/patient/login";
      const body = mode === "register" ? { phone, password, fullName } : { phone, password };
      const { data } = await api.post(url, body);
      saveSession(data.token, "PATIENT");
      navigate(`/book/${hospitalSlug}/appointment`);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Kuch galat ho gaya, dobara try karein.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl text-teal-700">Welcome</h1>
          <p className="text-ink/60 text-sm mt-1">City General Hospital — Appointment Booking</p>
        </div>

        <div className="card p-6">
          <div className="flex mb-5 bg-teal-50 rounded-lg p-1">
            <button
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "register" ? "bg-white shadow-sm text-teal-700" : "text-ink/50"}`}
              onClick={() => setMode("register")}
            >
              New Patient
            </button>
            <button
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "login" ? "bg-white shadow-sm text-teal-700" : "text-ink/50"}`}
              onClick={() => setMode("login")}
            >
              Existing Patient
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <input
                className="input"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            <input
              className="input"
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Please wait..." : mode === "register" ? "Register & Continue" : "Login & Continue"}
            </button>
          </form>
        </div>
        <p className="text-xs text-center text-ink/40 mt-4">
          Note: production mein password ki jagah OTP verification use hogi.
        </p>
      </div>
    </div>
  );
}
