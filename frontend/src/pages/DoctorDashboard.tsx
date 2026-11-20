import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession } from "../api/client";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    api.get("/appointments/queue").then((r) => setQueue(r.data));
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.get("/doctor/patients/search", { params: { q: query } }).then((r) => setResults(r.data));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function logout() {
    clearSession();
    navigate("/");
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <h1 className="font-display text-2xl text-teal-700">Doctor Dashboard</h1>
        <button onClick={logout} className="text-sm text-ink/50 hover:text-teal-700">
          Logout
        </button>
      </div>

      {/* "doctor usse uska name puche" -> search box */}
      <div className="card p-5 mb-8">
        <p className="text-sm font-medium mb-3">Patient dhundhein (name / Patient ID / phone)</p>
        <input
          className="input"
          placeholder="Type patient's name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <div className="mt-3 divide-y divide-teal-50">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/doctor/patient/${p.id}`)}
                className="w-full text-left py-3 flex justify-between items-center hover:bg-teal-50/50 px-2 rounded"
              >
                <div>
                  <p className="font-medium">{p.fullName}</p>
                  <p className="text-xs text-ink/50">{p.patientCode}</p>
                </div>
                <span className="text-teal-600 text-sm">View history →</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm font-medium text-ink/60 mb-3">Today's Queue</p>
      <div className="space-y-2">
        {queue.length === 0 && <p className="text-ink/40 text-sm">Queue khali hai.</p>}
        {queue.map((a) => (
          <div key={a.id} className="card p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">
                #{a.tokenNumber} — {a.patient.fullName}
              </p>
              <p className="text-xs text-ink/50">{a.reasonNote || "No reason noted"}</p>
            </div>
            <button
              className="btn-secondary text-sm"
              onClick={() => navigate(`/doctor/consultation/${a.id}/${a.patientId}`)}
            >
              Start Consultation
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
