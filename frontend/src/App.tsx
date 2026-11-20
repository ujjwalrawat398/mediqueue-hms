import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import PatientAuth from "./pages/PatientAuth";
import BookAppointment from "./pages/BookAppointment";
import PatientPortal from "./pages/PatientPortal";
import DoctorLogin from "./pages/DoctorLogin";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientHistoryView from "./pages/PatientHistoryView";
import ConsultationRoom from "./pages/ConsultationRoom";
import { getRole } from "./api/client";

function RequireRole({ role, children }: { role: string; children: JSX.Element }) {
  if (getRole() !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Patient flow: QR lands here */}
      <Route path="/book/:hospitalSlug" element={<PatientAuth />} />
      <Route
        path="/book/:hospitalSlug/appointment"
        element={
          <RequireRole role="PATIENT">
            <BookAppointment />
          </RequireRole>
        }
      />
      <Route
        path="/portal"
        element={
          <RequireRole role="PATIENT">
            <PatientPortal />
          </RequireRole>
        }
      />

      {/* Doctor flow */}
      <Route path="/doctor/login" element={<DoctorLogin />} />
      <Route
        path="/doctor/dashboard"
        element={
          <RequireRole role="DOCTOR">
            <DoctorDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/doctor/patient/:patientId"
        element={
          <RequireRole role="DOCTOR">
            <PatientHistoryView />
          </RequireRole>
        }
      />
      <Route
        path="/doctor/consultation/:appointmentId/:patientId"
        element={
          <RequireRole role="DOCTOR">
            <ConsultationRoom />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
