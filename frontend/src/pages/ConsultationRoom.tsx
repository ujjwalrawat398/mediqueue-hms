import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";

interface RxItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  durationDays: number;
  instructions: string;
}

export default function ConsultationRoom() {
  const { appointmentId, patientId } = useParams();
  const navigate = useNavigate();

  const [history, setHistory] = useState<any>(null);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [visit, setVisit] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  const [medQuery, setMedQuery] = useState("");
  const [medResults, setMedResults] = useState<any[]>([]);
  const [rxItems, setRxItems] = useState<RxItem[]>([]);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get(`/doctor/patients/${patientId}/history`).then((r) => setHistory(r.data));
  }, [patientId]);

  useEffect(() => {
    if (medQuery.trim().length < 2) return setMedResults([]);
    const t = setTimeout(() => {
      api.get("/doctor/medicines/search", { params: { q: medQuery } }).then((r) => setMedResults(r.data));
    }, 250);
    return () => clearTimeout(t);
  }, [medQuery]);

  async function startVisit() {
    const { data } = await api.post(`/doctor/appointments/${appointmentId}/start-visit`, { chiefComplaint });
    setVisit(data);
  }

  async function saveVisitDetails() {
    await api.patch(`/doctor/visits/${visit.id}`, { diagnosis, doctorNotes: notes });
  }

  function addMedicine(m: any) {
    setRxItems((prev) => [
      ...prev,
      { medicineId: m.id, medicineName: `${m.name} ${m.strength || ""}`.trim(), dosage: "1-0-1", durationDays: 5, instructions: "" },
    ]);
    setMedQuery("");
    setMedResults([]);
  }

  function updateItem(idx: number, field: keyof RxItem, value: string | number) {
    setRxItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  function removeItem(idx: number) {
    setRxItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function sendToPharmacy() {
    await saveVisitDetails();
    await api.post(`/doctor/visits/${visit.id}/prescribe`, {
      items: rxItems.map(({ medicineId, dosage, durationDays, instructions }) => ({
        medicineId,
        dosage,
        durationDays,
        instructions: instructions || undefined,
      })),
    });
    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card p-8 max-w-sm text-center">
          <p className="text-teal-700 text-lg font-medium mb-2">✓ Prescription sent to pharmacy</p>
          <p className="text-ink/60 text-sm mb-6">
            Patient apni Patient ID pharmacy counter par batakar medicines le sakta hai.
          </p>
          <button className="btn-primary w-full" onClick={() => navigate("/doctor/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-3xl mx-auto">
      <button onClick={() => navigate("/doctor/dashboard")} className="text-sm text-teal-700 mb-4">
        ← Back to Queue
      </button>

      {history && (
        <div className="card p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-display text-xl text-teal-700">{history.patient.fullName}</h1>
              <p className="text-ink/50 text-sm">
                {history.patient.patientCode} · {history.totalVisits} previous visit(s)
              </p>
            </div>
            <button
              className="text-teal-700 text-sm underline"
              onClick={() => navigate(`/doctor/patient/${patientId}`)}
            >
              View full history
            </button>
          </div>
          {history.patient.allergies && (
            <p className="mt-2 text-sm bg-red-50 text-red-700 rounded px-3 py-1.5">
              ⚠ Allergies: {history.patient.allergies}
            </p>
          )}
        </div>
      )}

      {!visit ? (
        <div className="card p-5">
          <p className="text-sm font-medium mb-2">Patient se problem puchein — Chief Complaint</p>
          <textarea
            className="input mb-3"
            rows={3}
            placeholder="e.g. Fever, sore throat since 2 days"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
          />
          <button className="btn-primary" disabled={!chiefComplaint.trim()} onClick={startVisit}>
            Start Consultation
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card p-5">
            <p className="text-sm font-medium mb-2">Diagnosis / Notes</p>
            <input
              className="input mb-2"
              placeholder="Diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
            <textarea
              className="input"
              rows={2}
              placeholder="Doctor notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="card p-5">
            <p className="text-sm font-medium mb-2">Prescribe Medicines</p>
            <input
              className="input mb-2"
              placeholder="Search medicine to add..."
              value={medQuery}
              onChange={(e) => setMedQuery(e.target.value)}
            />
            {medResults.length > 0 && (
              <div className="border border-teal-100 rounded-lg mb-3 divide-y divide-teal-50">
                {medResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => addMedicine(m)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50"
                  >
                    {m.name} {m.strength} ({m.form})
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {rxItems.map((item, idx) => (
                <div key={idx} className="border border-teal-100 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-sm">{item.medicineName}</p>
                    <button onClick={() => removeItem(idx)} className="text-red-500 text-xs">
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      className="input text-sm"
                      placeholder="Dosage e.g. 1-0-1"
                      value={item.dosage}
                      onChange={(e) => updateItem(idx, "dosage", e.target.value)}
                    />
                    <input
                      className="input text-sm"
                      type="number"
                      placeholder="Days"
                      value={item.durationDays}
                      onChange={(e) => updateItem(idx, "durationDays", Number(e.target.value))}
                    />
                    <input
                      className="input text-sm"
                      placeholder="Instructions"
                      value={item.instructions}
                      onChange={(e) => updateItem(idx, "instructions", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn-primary w-full mt-4"
              disabled={rxItems.length === 0}
              onClick={sendToPharmacy}
            >
              Send Prescription to Pharmacy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
