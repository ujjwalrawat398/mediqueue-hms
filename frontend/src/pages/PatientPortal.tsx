import { useEffect, useState } from "react";
import { api, clearSession } from "../api/client";
import { useNavigate } from "react-router-dom";

type Tab = "overview" | "visits" | "prescriptions" | "reports";

export default function PatientPortal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [me, setMe] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    api.get("/patient/me").then((r) => setMe(r.data));
    api.get("/patient/appointments").then((r) => setAppointments(r.data));
    api.get("/patient/history").then((r) => setVisits(r.data));
    api.get("/patient/prescriptions").then((r) => setPrescriptions(r.data));
    api.get("/patient/reports").then((r) => setReports(r.data));
  }, []);

  function logout() {
    clearSession();
    navigate("/");
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display text-2xl text-teal-700">{me?.fullName || "My Portal"}</h1>
          {me && <p className="text-ink/50 text-sm">Patient ID: {me.patientCode}</p>}
        </div>
        <button onClick={logout} className="text-sm text-ink/50 hover:text-teal-700">
          Logout
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-teal-100 overflow-x-auto">
        {(["overview", "visits", "prescriptions", "reports"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm capitalize border-b-2 whitespace-nowrap ${
              tab === t ? "border-teal-600 text-teal-700 font-medium" : "border-transparent text-ink/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink/60">Upcoming / Recent Appointments</p>
          {appointments.length === 0 && <p className="text-ink/40 text-sm">Koi appointment nahi mila.</p>}
          {appointments.map((a) => (
            <div key={a.id} className="card p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{a.department?.name}</p>
                <p className="text-xs text-ink/50">
                  {a.doctor ? `Dr. ${a.doctor.fullName}` : "Doctor TBD"} · Token #{a.tokenNumber}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-700">{a.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "visits" && (
        <div className="space-y-3">
          {visits.length === 0 && <p className="text-ink/40 text-sm">Abhi tak koi visit record nahi.</p>}
          {visits.map((v) => (
            <div key={v.id} className="card p-4">
              <div className="flex justify-between">
                <p className="font-medium">{v.doctor?.department?.name}</p>
                <p className="text-xs text-ink/40">{new Date(v.visitDate).toLocaleDateString()}</p>
              </div>
              <p className="text-sm text-ink/60 mb-1">Dr. {v.doctor?.fullName}</p>
              <p className="text-sm">
                <span className="text-ink/50">Complaint: </span>
                {v.chiefComplaint}
              </p>
              {v.diagnosis && (
                <p className="text-sm">
                  <span className="text-ink/50">Diagnosis: </span>
                  {v.diagnosis}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "prescriptions" && (
        <div className="space-y-3">
          {prescriptions.length === 0 && <p className="text-ink/40 text-sm">Koi prescription nahi mili.</p>}
          {prescriptions.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex justify-between mb-2">
                <p className="text-sm text-ink/60">Dr. {p.doctor?.fullName}</p>
                <span className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-700">{p.status}</span>
              </div>
              <ul className="text-sm space-y-1">
                {p.items.map((i: any) => (
                  <li key={i.id}>
                    • {i.medicine.name} {i.medicine.strength} — {i.dosage} for {i.durationDays} days
                    {i.instructions ? ` (${i.instructions})` : ""}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-ink/40 mt-2">
                Pharmacy counter par apni Patient ID batayein — medicines wahan mil jayengi.
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          {reports.length === 0 && <p className="text-ink/40 text-sm">Koi report upload nahi hui abhi.</p>}
          {reports.map((r) => (
            <a key={r.id} href={r.fileUrl} target="_blank" className="card p-4 flex justify-between items-center">
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-ink/40">{new Date(r.uploadedAt).toLocaleDateString()}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
