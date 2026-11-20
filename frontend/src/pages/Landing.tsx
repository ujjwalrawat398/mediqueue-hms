import { Link } from "react-router-dom";

// In real deployment, this page isn't visited directly — the printed QR
// at reception encodes /book/:hospitalSlug and the patient's camera app
// opens that link directly. This landing page exists for demo/testing
// and for staff login.
export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="font-display text-4xl text-teal-700 mb-2">MediQueue</h1>
        <p className="text-ink/60 mb-10">Hospital appointment &amp; records system</p>

        <div className="card p-8 mb-4">
          <p className="text-sm text-ink/60 mb-4">
            Reception par lage QR ko scan karne par patient seedha yahan pahunchta hai.
            Demo ke liye:
          </p>
          <Link to="/book/city-general-hospital" className="btn-primary block">
            Scan QR (Demo) → Book Appointment
          </Link>
        </div>

        <Link to="/doctor/login" className="text-teal-700 text-sm hover:underline">
          Doctor / Staff Login →
        </Link>
      </div>
    </div>
  );
}
