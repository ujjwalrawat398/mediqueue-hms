import { Router } from "express";
import { generateBookingQR } from "../utils/qrcode";

const router = Router();

// GET /api/qr/:hospitalSlug -> returns a base64 PNG data URL to print/display
router.get("/:hospitalSlug", async (req, res) => {
  const dataUrl = await generateBookingQR(req.params.hospitalSlug);
  res.json({ qr: dataUrl });
});

export default router;
