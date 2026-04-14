/**
 * POST /api/install/test-db      — test PostgreSQL connection
 * POST /api/install/test-supabase — test Supabase connection
 * POST /api/install/test-paymob  — test Paymob API key
 * POST /api/install/test-telegram — test Telegram Bot
 * POST /api/install/run           — write .env + run db:push
 * GET  /api/install/status        — check if already installed
 */
import { Router } from "express";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

// ── guard: block if already installed in production ──────────────
function isInstalled(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.DATABASE_URL &&
         process.env.NODE_ENV === "production";
}

router.get("/status", (_req, res) => {
  res.json({ installed: isInstalled(), node_env: process.env.NODE_ENV });
});

// ── Test PostgreSQL ───────────────────────────────────────────────
router.post("/test-db", async (req, res) => {
  const { database_url } = req.body as { database_url: string };
  if (!database_url) return res.status(400).json({ ok: false, message: "DATABASE_URL مطلوب" });
  try {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: database_url });
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    res.json({ ok: true, message: "الاتصال بقاعدة البيانات ناجح ✓" });
  } catch (e: any) {
    res.json({ ok: false, message: `فشل الاتصال: ${e.message}` });
  }
});

// ── Test Supabase ─────────────────────────────────────────────────
router.post("/test-supabase", async (req, res) => {
  const { supabase_url, supabase_anon_key } = req.body as any;
  if (!supabase_url || !supabase_anon_key)
    return res.status(400).json({ ok: false, message: "بيانات Supabase مطلوبة" });
  try {
    const resp = await fetch(`${supabase_url}/rest/v1/campaigns?limit=1`, {
      headers: {
        "apikey": supabase_anon_key,
        "Authorization": `Bearer ${supabase_anon_key}`,
      },
    });
    if (resp.ok || resp.status === 416) {
      res.json({ ok: true, message: "الاتصال بـ Supabase ناجح ✓" });
    } else {
      const text = await resp.text();
      res.json({ ok: false, message: `Supabase رد بـ ${resp.status}: ${text.slice(0, 120)}` });
    }
  } catch (e: any) {
    res.json({ ok: false, message: `فشل الاتصال بـ Supabase: ${e.message}` });
  }
});

// ── Test Paymob ───────────────────────────────────────────────────
router.post("/test-paymob", async (req, res) => {
  const { paymob_api_key } = req.body as any;
  if (!paymob_api_key) return res.json({ ok: true, message: "تم تخطي Paymob (اختياري)" });
  try {
    const resp = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: paymob_api_key }),
    });
    if (resp.ok) res.json({ ok: true, message: "Paymob API Key صحيح ✓" });
    else res.json({ ok: false, message: `Paymob: مفتاح غير صحيح (HTTP ${resp.status})` });
  } catch (e: any) {
    res.json({ ok: false, message: `فشل الاتصال بـ Paymob: ${e.message}` });
  }
});

// ── Test Telegram ─────────────────────────────────────────────────
router.post("/test-telegram", async (req, res) => {
  const { telegram_bot_token } = req.body as any;
  if (!telegram_bot_token) return res.json({ ok: true, message: "تم تخطي Telegram (اختياري)" });
  try {
    const resp = await fetch(`https://api.telegram.org/bot${telegram_bot_token}/getMe`);
    const data = await resp.json() as any;
    if (data.ok) res.json({ ok: true, message: `Telegram Bot: @${data.result.username} ✓` });
    else res.json({ ok: false, message: "Telegram Token غير صحيح" });
  } catch (e: any) {
    res.json({ ok: false, message: `فشل الاتصال بـ Telegram: ${e.message}` });
  }
});

// ── Run Installation ──────────────────────────────────────────────
router.post("/run", async (req, res) => {
  if (isInstalled()) {
    return res.status(403).json({ ok: false, message: "المشروع مثبّت بالفعل" });
  }

  const {
    database_url, supabase_url, supabase_anon_key, supabase_service_role_key,
    session_secret,
    paymob_api_key = "", paymob_integration_id = "", paymob_iframe_id = "", paymob_hmac_secret = "",
    telegram_bot_token = "", telegram_chat_id = "",
    whatsapp_token = "", whatsapp_phone_id = "",
    ultramsg_instance = "", ultramsg_token = "",
    smtp_host = "", smtp_port = "587", smtp_user = "", smtp_pass = "", smtp_from = "",
    frontend_url = "",
  } = req.body as any;

  const missing = [];
  if (!database_url)              missing.push("DATABASE_URL");
  if (!supabase_url)              missing.push("SUPABASE_URL");
  if (!supabase_anon_key)         missing.push("SUPABASE_ANON_KEY");
  if (!supabase_service_role_key) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!session_secret)            missing.push("SESSION_SECRET");

  if (missing.length) {
    return res.status(400).json({ ok: false, message: `حقول مطلوبة: ${missing.join(", ")}` });
  }

  const envContent = `# رفقاء البررة — تم التثبيت بواسطة Install Wizard — ${new Date().toLocaleString("ar-EG")}

DATABASE_URL=${database_url}
SUPABASE_URL=${supabase_url}
SUPABASE_ANON_KEY=${supabase_anon_key}
SUPABASE_SERVICE_ROLE_KEY=${supabase_service_role_key}
SESSION_SECRET=${session_secret}
NODE_ENV=production
PAYMOB_API_KEY=${paymob_api_key}
PAYMOB_INTEGRATION_ID=${paymob_integration_id}
PAYMOB_IFRAME_ID=${paymob_iframe_id}
PAYMOB_HMAC_SECRET=${paymob_hmac_secret}
TELEGRAM_BOT_TOKEN=${telegram_bot_token}
TELEGRAM_CHAT_ID=${telegram_chat_id}
WHATSAPP_TOKEN=${whatsapp_token}
WHATSAPP_PHONE_ID=${whatsapp_phone_id}
ULTRAMSG_INSTANCE=${ultramsg_instance}
ULTRAMSG_TOKEN=${ultramsg_token}
SMTP_HOST=${smtp_host}
SMTP_PORT=${smtp_port}
SMTP_USER=${smtp_user}
SMTP_PASS=${smtp_pass}
SMTP_FROM=${smtp_from}
FRONTEND_URL=${frontend_url}
`;

  try {
    // Write .env for api-server
    const apiServerDir = path.resolve(ROOT, "artifacts/api-server");
    fs.writeFileSync(path.join(apiServerDir, ".env"), envContent, "utf-8");

    // Write .env for frontend
    const frontendDir = path.resolve(ROOT, "artifacts/rafaqaa-website");
    fs.writeFileSync(path.join(frontendDir, ".env"), "VITE_API_URL=\n", "utf-8");

    // Run db:push with the provided DATABASE_URL
    execSync(
      `DATABASE_URL="${database_url}" pnpm --filter @workspace/api-server run db:push`,
      { cwd: ROOT, stdio: "pipe", env: { ...process.env, DATABASE_URL: database_url }, timeout: 60000 }
    );

    res.json({
      ok: true,
      message: "تم التثبيت بنجاح!",
      credentials: {
        admin: { username: "admin", password: "admin123" },
        supervisor: { username: "supervisor", password: "Rafaqaa@Sup2025" },
      },
      next_steps: [
        "غيّر كلمات المرور الافتراضية فور تسجيل الدخول",
        "ارفع الكود على GitHub وانشره على Vercel",
        "أضف نفس المتغيرات في Vercel → Environment Variables",
      ],
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: `فشل التثبيت: ${e.message || e}` });
  }
});

export default router;
