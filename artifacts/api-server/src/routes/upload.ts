import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// On Vercel/serverless: use /tmp (writable). Locally: use uploads/ folder.
const uploadsDir = process.env.NODE_ENV === "production" || process.env.VERCEL
  ? "/tmp/uploads/receipts"
  : path.join(__dirname, "..", "..", "uploads", "receipts");

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {
  // Ignore if directory creation fails (e.g. read-only fs)
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `receipt_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("نوع الملف غير مدعوم"));
  },
});

const router = Router();

router.post("/receipt", upload.single("file"), (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: "لم يتم رفع الملف" });

  const url = `/api/uploads/receipts/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

export default router;
