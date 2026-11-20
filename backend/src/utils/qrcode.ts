import QRCode from "qrcode";

// Generates a QR code (as a base64 PNG data URL) that, when scanned,
// opens the patient's phone browser directly to the booking page.
// One QR can be printed and stuck at hospital reception / each counter.
export async function generateBookingQR(hospitalSlug: string): Promise<string> {
  const bookingUrl = `${process.env.PUBLIC_APP_URL || "https://yourhospital.example.com"}/book/${hospitalSlug}`;
  return QRCode.toDataURL(bookingUrl, { width: 400, margin: 2 });
}
