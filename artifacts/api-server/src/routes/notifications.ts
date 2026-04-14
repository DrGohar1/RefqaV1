import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

// Helper: get notification settings from local DB
async function getNotifSettings(): Promise<Record<string, any>> {
  try {
    const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "notification_settings")).limit(1);
    return (row[0]?.value as any) || {};
  } catch { return {}; }
}

async function saveNotifSettings(settings: Record<string, any>) {
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, "notification_settings")).limit(1);
  if (existing.length) {
    await db.update(settingsTable).set({ value: settings, updated_at: new Date() }).where(eq(settingsTable.key, "notification_settings"));
  } else {
    await db.insert(settingsTable).values({ key: "notification_settings", value: settings });
  }
}

// GET /api/notifications/settings — get all (masked)
router.get("/settings", requireAuth, async (_req, res) => {
  try {
    const s = await getNotifSettings();
    res.json({
      telegram: {
        enabled: s.telegram?.enabled || false,
        bot_token_set: !!s.telegram?.bot_token,
        chat_id: s.telegram?.chat_id || "",
        on_new_donation: s.telegram?.on_new_donation ?? true,
        on_approved: s.telegram?.on_approved ?? true,
        on_rejected: s.telegram?.on_rejected ?? false,
        on_agent_register: s.telegram?.on_agent_register ?? true,
        on_field_order: s.telegram?.on_field_order ?? true,
      },
      whatsapp: {
        enabled: s.whatsapp?.enabled || false,
        provider: s.whatsapp?.provider || "whatsapp_business",
        api_url: s.whatsapp?.api_url || "",
        token_set: !!s.whatsapp?.token,
        phone_number_id: s.whatsapp?.phone_number_id || "",
        send_thank_you: s.whatsapp?.send_thank_you ?? true,
        send_confirmation: s.whatsapp?.send_confirmation ?? true,
        thank_you_template: s.whatsapp?.thank_you_template || "شكراً لتبرعك الكريم يا {name}! تبرعك بمبلغ {amount} جنيه سيُغيِّر حياة كثيرين. بارك الله فيك. رقم عمليتك: {refqa_id}",
      },
      twilio: {
        enabled: s.twilio?.enabled || false,
        account_sid_set: !!s.twilio?.account_sid,
        auth_token_set: !!s.twilio?.auth_token,
        from_number: s.twilio?.from_number || "",
        from_name: s.twilio?.from_name || "رفقاء البررة",
        send_sms_on_approve: s.twilio?.send_sms_on_approve ?? true,
      },
      email: {
        enabled: s.email?.enabled || false,
        smtp_host: s.email?.smtp_host || "",
        smtp_port: s.email?.smtp_port || 587,
        smtp_user: s.email?.smtp_user || "",
        smtp_pass_set: !!s.email?.smtp_pass,
        from_email: s.email?.from_email || "",
        from_name: s.email?.from_name || "مؤسسة رفقاء البررة",
        send_on_approve: s.email?.send_on_approve ?? true,
        send_on_register: s.email?.send_on_register ?? true,
      },
    });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST /api/notifications/settings — save
router.post("/settings", requireAuth, async (req, res) => {
  try {
    const existing = await getNotifSettings();
    const { section, ...data } = req.body;
    if (!section) return res.status(400).json({ message: "section مطلوب" });

    const updated = { ...existing, [section]: { ...(existing[section] || {}), ...data } };
    await saveNotifSettings(updated);
    res.json({ success: true, message: "تم الحفظ" });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST /api/notifications/telegram/test — send test message
router.post("/telegram/test", requireAuth, async (req, res) => {
  try {
    const s = await getNotifSettings();
    const tg = s.telegram;
    if (!tg?.bot_token || !tg?.chat_id) return res.status(400).json({ message: "يجب ضبط Bot Token و Chat ID أولاً" });

    const text = "🧪 *اختبار تيليجرام* — مؤسسة رفقاء البررة\n✅ الاتصال يعمل بنجاح!";
    const response = await fetch(`https://api.telegram.org/bot${tg.bot_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tg.chat_id, text, parse_mode: "Markdown" }),
    });
    const result = await response.json() as any;
    if (!result.ok) return res.status(400).json({ message: result.description || "فشل إرسال الرسالة" });
    res.json({ success: true, message: "✅ تم إرسال رسالة الاختبار بنجاح" });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST /api/notifications/telegram/set-token — update bot token securely
router.post("/telegram/set-token", requireAuth, async (req, res) => {
  try {
    const { bot_token, chat_id } = req.body;
    const existing = await getNotifSettings();
    const updated = { ...existing, telegram: { ...(existing.telegram || {}), bot_token, chat_id } };
    await saveNotifSettings(updated);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST /api/notifications/whatsapp/set-token
router.post("/whatsapp/set-token", requireAuth, async (req, res) => {
  try {
    const { token, phone_number_id, api_url } = req.body;
    const existing = await getNotifSettings();
    const updated = { ...existing, whatsapp: { ...(existing.whatsapp || {}), token, phone_number_id, api_url } };
    await saveNotifSettings(updated);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST /api/notifications/whatsapp/test
router.post("/whatsapp/test", requireAuth, async (req, res) => {
  try {
    const s = await getNotifSettings();
    const wa = s.whatsapp;
    if (!wa?.token || !wa?.phone_number_id) return res.status(400).json({ message: "يجب ضبط إعدادات واتساب أولاً" });

    const { test_phone } = req.body;
    if (!test_phone) return res.status(400).json({ message: "أدخل رقم هاتف للاختبار" });

    const url = wa.api_url || `https://graph.facebook.com/v18.0/${wa.phone_number_id}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to: test_phone.replace(/\D/g, ""),
      type: "text",
      text: { body: "🧪 اختبار واتساب — مؤسسة رفقاء البررة ✅ الاتصال يعمل بنجاح!" },
    };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${wa.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json() as any;
    if (result.error) return res.status(400).json({ message: result.error.message });
    res.json({ success: true, message: "✅ تم إرسال رسالة الاختبار" });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST /api/notifications/twilio/set-credentials
router.post("/twilio/set-credentials", requireAuth, async (req, res) => {
  try {
    const { account_sid, auth_token } = req.body;
    const existing = await getNotifSettings();
    const updated = { ...existing, twilio: { ...(existing.twilio || {}), account_sid, auth_token } };
    await saveNotifSettings(updated);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST /api/notifications/twilio/test
router.post("/twilio/test", requireAuth, async (req, res) => {
  try {
    const s = await getNotifSettings();
    const tw = s.twilio;
    if (!tw?.account_sid || !tw?.auth_token) return res.status(400).json({ message: "يجب ضبط بيانات Twilio أولاً" });
    const { test_phone } = req.body;
    if (!test_phone) return res.status(400).json({ message: "أدخل رقم هاتف للاختبار" });

    const auth = Buffer.from(`${tw.account_sid}:${tw.auth_token}`).toString("base64");
    const body = new URLSearchParams({ To: test_phone, From: tw.from_number, Body: "🧪 اختبار SMS — مؤسسة رفقاء البررة ✅" });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${tw.account_sid}/Messages.json`, {
      method: "POST", headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const result = await response.json() as any;
    if (result.status === "failed" || result.error_code) return res.status(400).json({ message: result.error_message || "فشل الإرسال" });
    res.json({ success: true, message: "✅ تم إرسال SMS بنجاح" });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST /api/notifications/email/set-credentials
router.post("/email/set-credentials", requireAuth, async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name } = req.body;
    const existing = await getNotifSettings();
    const updated = { ...existing, email: { ...(existing.email || {}), smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name } };
    await saveNotifSettings(updated);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST /api/notifications/email/test
router.post("/email/test", requireAuth, async (req, res) => {
  try {
    const s = await getNotifSettings();
    const em = s.email;
    if (!em?.smtp_host || !em?.smtp_user || !em?.smtp_pass) return res.status(400).json({ message: "يجب ضبط إعدادات البريد أولاً" });
    const { test_email } = req.body;
    if (!test_email) return res.status(400).json({ message: "أدخل بريد إلكتروني للاختبار" });
    // Use nodemailer if installed, else return config
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: em.smtp_host, port: em.smtp_port || 587, secure: (em.smtp_port || 587) === 465,
        auth: { user: em.smtp_user, pass: em.smtp_pass },
      });
      await transporter.sendMail({
        from: `"${em.from_name || 'رفقاء البررة'}" <${em.from_email || em.smtp_user}>`,
        to: test_email,
        subject: "🧪 اختبار البريد — رفقاء البررة",
        html: `<div dir="rtl" style="font-family:Arial;padding:20px"><h2>✅ اتصال البريد يعمل بنجاح!</h2><p>هذه رسالة اختبار من منظومة إشعارات مؤسسة رفقاء البررة.</p></div>`,
      });
      res.json({ success: true, message: "✅ تم إرسال البريد بنجاح" });
    } catch (mailErr: any) {
      res.status(400).json({ message: `خطأ في الإرسال: ${mailErr.message}` });
    }
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// ─── Internal helper: send Telegram notification ───
export async function sendTelegramNotif(text: string) {
  try {
    const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "notification_settings")).limit(1);
    const s = (row[0]?.value as any) || {};
    const tg = s.telegram;
    if (!tg?.enabled || !tg?.bot_token || !tg?.chat_id) return;
    await fetch(`https://api.telegram.org/bot${tg.bot_token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tg.chat_id, text, parse_mode: "Markdown" }),
    });
  } catch { /* silent */ }
}

// ─── Internal helper: send WhatsApp message ───
export async function sendWhatsAppNotif(phone: string, message: string) {
  try {
    const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "notification_settings")).limit(1);
    const s = (row[0]?.value as any) || {};
    const wa = s.whatsapp;
    if (!wa?.enabled || !wa?.token || !wa?.phone_number_id) return;
    const url = wa.api_url || `https://graph.facebook.com/v18.0/${wa.phone_number_id}/messages`;
    await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${wa.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: phone.replace(/\D/g, ""), type: "text", text: { body: message } }),
    });
  } catch { /* silent */ }
}

// ─── Internal helper: send Email ───
export async function sendEmailNotif(to: string, subject: string, html: string) {
  try {
    const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "notification_settings")).limit(1);
    const s = (row[0]?.value as any) || {};
    const em = s.email;
    if (!em?.enabled || !em?.smtp_host || !em?.smtp_pass) return;
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: em.smtp_host, port: em.smtp_port || 587, secure: (em.smtp_port || 587) === 465,
      auth: { user: em.smtp_user, pass: em.smtp_pass },
    });
    await transporter.sendMail({ from: `"${em.from_name || 'رفقاء البررة'}" <${em.from_email || em.smtp_user}>`, to, subject, html });
  } catch { /* silent */ }
}

export default router;
