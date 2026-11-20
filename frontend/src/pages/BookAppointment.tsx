import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

interface Doctor {
  id: string;
  fullName: string;
  qualification: string | null;
}
interface Department {
  id: string;
  name: string;
  doctors: Doctor[];
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [reason, setReason] = useState("");
  const [booked, setBooked] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/appointments/departments").then((res) => setDepartments(res.data));
  }, []);

  async function handleBook() {
    if (!selectedDept) return;
    setLoading(true);
    try {
      const { data } = await api.post("/appointments/book", {
        departmentId: selectedDept.id,
        doctorId: selectedDoctor || undefined,
        reasonNote: reason || undefined,
      });
      setBooked(data);
    } finally {
      setLoading(false);
    }
  }

  if (booked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card p-8 max-w-sm w-full text-center">
          <p className="text-ink/60 text-sm mb-2">Your Token Number</p>
          <p className="text-6xl font-display text-teal-700 mb-4">{booked.tokenNumber}</p>
          <p className="text-ink/70 mb-1">{booked.department?.name}</p>
          {booked.doctor && <p className="text-ink/50 text-sm mb-6">Dr. {booked.doctor.fullName}</p>}
          <button className="btn-primary w-full" onClick={() => navigate("/portal")}>
            View My Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 flex justify-center">
      <div className="max-w-md w-full">
        <h1 className="font-display text-2xl text-teal-700 mb-1">Book Appointment</h1>
        <p className="text-ink/60 text-sm mb-6">Department chuniye jiske regarding aana hai</p>

        <div className="space-y-2 mb-6">
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDept(d);
                setSelectedDoctor("");
              }}
              className={`w-full text-left p-4 rounded-lg border transition ${
                selectedDept?.id === d.id ? "border-teal-600 bg-teal-50" : "border-teal-100 bg-white"
              }`}
            >
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-ink/50">{d.doctors.length} doctor(s) available</p>
            </button>
          ))}
        </div>

        {selectedDept && selectedDept.doctors.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">Doctor chuniye (optional)</p>
            <select className="input" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
              <option value="">Kisi bhi available doctor se</option>
              {selectedDept.doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.fullName} {doc.qualification ? `(${doc.qualification})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedDept && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">Problem ka short reason (optional)</p>
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. Fever since 2 days"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        <button className="btn-primary w-full" disabled={!selectedDept || loading} onClick={handleBook}>
          {loading ? "Booking..." : "Get Token Number"}
        </button>
      </div>
    </div>
  );
}
