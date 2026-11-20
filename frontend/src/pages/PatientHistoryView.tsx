import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";

export default function PatientHistoryView() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get(`/doctor/patients/${patientId}/history`).then((r) => setData(r.data));
  }, [patientId]);

  if (!data) return <div className="p-8 text-ink/50">Loading history...</div>;

  const { patient, visits, totalVisits } = data;

  return (
    <div className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-teal-700 mb-4">
        ← Back
      </button>

      <div className="card p-5 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-xl text-teal-700">{patient.fullName}</h1>
            <p className="text-ink/50 text-sm">{patient.patientCode}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-display text-teal-700">{totalVisits}</p>
            <p className="text-xs text-ink/50">total visits</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
          <p><span className="text-ink/50">Gender:</span> {patient.gender || "—"}</p>
          <p><span className="text-ink/50">Blood Group:</span> {patient.bloodGroup || "—"}</p>
        </div>
        {patient.allergies && (
          <p className="mt-2 text-sm bg-red-50 text-red-700 rounded px-3 py-2">
            ⚠ Allergies: {patient.allergies}
          </p>
        )}
        {patient.chronicConditions && (
          <p className="mt-2 text-sm bg-amber-50 text-amber-700 rounded px-3 py-2">
            Chronic: {patient.chronicConditions}
          </p>
        )}
      </div>

      <p className="text-sm font-medium text-ink/60 mb-3">Visit History (all doctors, all departments)</p>
      <div className="space-y-3">
        {visits.length === 0 && <p className="text-ink/40 text-sm">Pehli baar aaya hai — koi past record nahi.</p>}
        {visits.map((v: any) => (
          <div key={v.id} className="card p-4">
            <div className="flex justify-between mb-1">
              <p className="font-medium text-sm">{v.doctor?.department?.name}</p>
              <p className="text-xs text-ink/40">{new Date(v.visitDate).toLocaleDateString()}</p>
            </div>
            <p className="text-xs text-ink/50 mb-2">Dr. {v.doctor?.fullName}</p>
            <p className="text-sm mb-1">
              <span className="text-ink/50">Complaint:</span> {v.chiefComplaint}
            </p>
            {v.diagnosis && (
              <p className="text-sm mb-1">
                <span className="text-ink/50">Diagnosis:</span> {v.diagnosis}
              </p>
            )}
            {v.prescription && (
              <div className="mt-2 bg-teal-50/60 rounded p-2">
                <p className="text-xs text-teal-700 font-medium mb-1">Medicines prescribed:</p>
                <ul className="text-xs space-y-0.5">
                  {v.prescription.items.map((i: any) => (
                    <li key={i.id}>
                      • {i.medicine.name} — {i.dosage}, {i.durationDays} days
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
