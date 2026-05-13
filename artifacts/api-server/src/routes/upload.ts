import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadsDir = process.env.NODE_ENV === "production" || process.env.VERCEL
  ? "/tmp/uploads/receipts"
  : path.join(__dirname, "..", "..", "uploads", "receipts");

const logoDir = process.env.NODE_ENV === "production" || process.env.VERCEL
  ? "/tmp/uploads/logo"
  : path.join(__dirname, "..", "..", "uploads", "logo");

for (const dir of [uploadsDir, logoDir]) {
  try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch {}
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `receipt_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `logo${ext}`);
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

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("يُسمح فقط بـ JPG/PNG/WebP/SVG"));
  },
});

const router = Router();

router.post("/receipt", upload.single("file"), (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: "لم يتم رفع الملف" });
  const url = `/api/uploads/receipts/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

// ── Logo endpoints ──
router.post("/logo", uploadLogo.single("file"), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: "لم يتم رفع اللوجو" });
  const ext = path.extname(req.file.filename);
  const url = `/api/uploads/logo/logo${ext}`;
  try {
    const { db } = await import("@workspace/db");
    const { settingsTable } = await import("@workspace/db/schema");
    await db.insert(settingsTable as any)
      .values({ key: "logo_url", value: url })
      .onConflictDoUpdate({ target: (settingsTable as any).key, set: { value: url } });
  } catch (e) { console.error("logo db save:", e); }
  res.json({ url });
});

router.get("/logo/current", async (_req, res) => {
  try {
    const { db } = await import("@workspace/db");
    const { settingsTable } = await import("@workspace/db/schema");
    const { eq } = await import("drizzle-orm");
    const [row] = await db.select().from(settingsTable as any)
      .where(eq((settingsTable as any).key, "logo_url")).limit(1);
    return res.json({ url: (row as any)?.value || null });
  } catch {
    return res.json({ url: null });
  }
});

// Serve logo file
router.get("/logo/:filename", (req, res) => {
  const filePath = path.join(logoDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: "اللوجو غير موجود" });
  }
});

export default router;
