import { Router } from "express";
import { db } from "@workspace/db";
import { donationsTable, paymentSettingsTable } from "@workspace/db/schema";
import { supabase } from "../lib/supabase.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendTelegramNotif, sendWhatsAppNotif, sendEmailNotif } from "./notifications.js";

const router = Router();
const PAYMOB_BASE = "https://accept.paymob.com/api";

// ═══════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════

async function getSettings() {
  const rows = await db.select().from(paymentSettingsTable).limit(1);
  return rows[0] ?? null;
}

/** Generate Refqa-YYYYMMDD-XXXX sequential ID */
async function generateRefqaId(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `Refqa-${dateStr}-`;

  // Count existing today transactions
  const { count } = await supabase
    .from("donations")
    .select("*", { count: "exact", head: true })
    .like("refqa_id", `${prefix}%`);

  const seq = ((count ?? 0) + 1).toString().padStart(4, "0");
  return `${prefix}${seq}`;
}

/** Paymob: Get auth token */
async function getPaymobToken(apiKey: string): Promise<string> {
  const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) throw new Error("فشل التوثيق مع Paymob");
  const data = await res.json() as any;
  return data.token;
}

/** Verify Paymob HMAC signature */
function verifyPaymobHmac(data: any, secret: string): boolean {
  try {
    const fields = [
      data.amount_cents, data.created_at, data.currency, data.error_occured,
      data.has_parent_transaction, data.id, data.integration_id, data.is_3d_secure,
      data.is_auth, data.is_capture, data.is_refunded, data.is_standalone_payment,
      data.is_voided, data.order?.id, data.owner, data.pending,
      data.source_data?.pan, data.source_data?.sub_type, data.source_data?.type,
      data.success,
    ];
    const str = fields.join("").replace(/undefined/g, "");
    const hmac = crypto.createHmac("sha512", secret).update(str).digest("hex");
    return hmac === data.hmac;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════
//  Routes
// ═══════════════════════════════════════════════

/**
 * POST /api/payments/initiate
 * Creates a pending transaction and returns iframe URL (or demo URL)
 */
router.post("/initiate", async (req, res) => {
  try {
    const {
      amount, donor_name, donor_phone, donor_email,
      campaign_id, campaign_title, integration_type = "card",
    } = req.body;

    if (!amount || !donor_name || !donor_phone) {
      return res.status(400).json({ message: "بيانات غير مكتملة: الاسم والهاتف والمبلغ مطلوبة" });
    }

    const settings = await getSettings();
    const refqaId = await generateRefqaId();

    // ── Demo / Test mode ──────────────────────────────
    const isDemoMode = !settings || !settings.is_active || !settings.api_key || settings.test_mode;

    if (isDemoMode) {
      // Create pending donation record
      const { data: donation } = await supabase.from("donations").insert({
        donor_name,
        donor_phone,
        donor_email: donor_email || null,
        campaign_id: campaign_id || null,
        campaign_title: campaign_title || null,
        amount: Number(amount),
        payment_method: "online_demo",
        operation_id: refqaId,
        refqa_id: refqaId,
        status: "pending",
      }).select().single();

      return res.json({
        demo_mode: true,
        refqa_id: refqaId,
        donation_id: donation?.id,
        payment_url: null,
        message: "وضع تجريبي — لا تتم معاملات حقيقية",
      });
    }

    // ── Paymob ────────────────────────────────────────
    if (settings.provider === "paymob") {
      const integrationId = integration_type === "wallet"
        ? settings.integration_id_wallet
        : settings.integration_id_card;
      const iframeId = integration_type === "wallet"
        ? settings.iframe_id_wallet
        : settings.iframe_id_card;

      if (!integrationId || !iframeId) {
        return res.status(503).json({
          message: `إعداد ${integration_type === "wallet" ? "المحفظة" : "بطاقة الدفع"} غير مكتمل — تحقق من إعدادات بوابة الدفع`,
          not_configured: true,
        });
      }

      const amountCents = Math.round(Number(amount) * 100);
      const token = await getPaymobToken(settings.api_key!);

      // Register order
      const orderRes = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          delivery_needed: false,
          amount_cents: amountCents,
          currency: "EGP",
          merchant_order_id: refqaId,
          items: campaign_title ? [{
            name: campaign_title,
            amount_cents: amountCents,
            description: `تبرع — ${campaign_title}`,
            quantity: 1,
          }] : [],
        }),
      });
      if (!orderRes.ok) throw new Error("فشل تسجيل الطلب في Paymob");
      const order = await orderRes.json() as any;

      // Get payment key
      const nameParts = donor_name.trim().split(" ");
      const payKeyRes = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          amount_cents: amountCents,
          expiration: 3600,
          order_id: order.id,
          billing_data: {
            first_name: nameParts[0] || donor_name,
            last_name: nameParts.slice(1).join(" ") || ".",
            phone_number: donor_phone,
            email: donor_email || "noreply@rafaqaa.org",
            country: "EG",
            city: "Cairo",
            street: "N/A",
            building: "N/A",
            floor: "N/A",
            apartment: "N/A",
          },
          currency: "EGP",
          integration_id: Number(integrationId),
          lock_order_when_paid: false,
        }),
      });
      if (!payKeyRes.ok) throw new Error("فشل الحصول على مفتاح الدفع");
      const payKeyData = await payKeyRes.json() as any;

      // Create PENDING donation — will be confirmed via webhook
      const { data: donation } = await supabase.from("donations").insert({
        donor_name,
        donor_phone,
        donor_email: donor_email || null,
        campaign_id: campaign_id || null,
        campaign_title: campaign_title || null,
        amount: Number(amount),
        payment_method: `online_${integration_type}`,
        operation_id: refqaId,
        refqa_id: refqaId,
        status: "pending",
        paymob_order_id: String(order.id),
      }).select().single();

      return res.json({
        demo_mode: false,
        refqa_id: refqaId,
        donation_id: donation?.id,
        payment_url: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${payKeyData.token}`,
        order_id: order.id,
      });
    }

    // ── Unknown provider ──────────────────────────────
    return res.status(503).json({
      message: "مزود الدفع غير مدعوم. يرجى إعداد بوابة الدفع من لوحة التحكم.",
      not_configured: true,
    });

  } catch (e: any) {
    console.error("Payment initiate error:", e);
    res.status(500).json({ message: e.message });
  }
});

/**
 * GET /api/payments/status/:refqaId
 * Check payment status by Refqa ID
 */
router.get("/status/:refqaId", async (req, res) => {
  try {
    const { refqaId } = req.params;
    const { data, error } = await supabase
      .from("donations")
      .select("id, refqa_id, status, amount, donor_name, campaign_title, confirmed_at, created_at")
      .eq("refqa_id", refqaId)
      .single();

    if (error || !data) return res.status(404).json({ message: "معاملة غير موجودة" });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * POST /api/payments/demo/confirm/:refqaId
 * Demo mode — manually confirm payment (for testing)
 */
router.post("/demo/confirm/:refqaId", async (req, res) => {
  try {
    const { refqaId } = req.params;

    // Check donation exists
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("refqa_id", refqaId)
      .single();

    if (error || !data) return res.status(404).json({ message: "معاملة غير موجودة" });
    if (data.status === "approved") return res.json({ success: true, already_confirmed: true });

    // Update to approved
    await supabase
      .from("donations")
      .update({
        status: "approved",
        confirmed_at: new Date().toISOString(),
        gateway_transaction_id: `DEMO-${Date.now()}`,
      })
      .eq("refqa_id", refqaId);

    // Update campaign raised amount
    if (data.campaign_id) {
      const { data: camp } = await supabase
        .from("campaigns")
        .select("raised_amount")
        .eq("id", data.campaign_id)
        .single();
      if (camp) {
        await supabase
          .from("campaigns")
          .update({ raised_amount: Number(camp.raised_amount) + Number(data.amount) })
          .eq("id", data.campaign_id);
      }
    }

    // ── Notifications ──
    sendTelegramNotif(
      `✅ *تم تأكيد دفع تجريبي*\n` +
      `👤 *المتبرع:* ${data.donor_name}\n` +
      `💵 *المبلغ:* ${Number(data.amount).toLocaleString("ar-EG")} جنيه\n` +
      `🔖 *رقم Refqa:* ${refqaId}`
    ).catch(() => {});

    if (data.donor_phone) {
      sendWhatsAppNotif(data.donor_phone,
        `شكراً لتبرعك الكريم يا ${data.donor_name}! تم تأكيد تبرعك بمبلغ ${Number(data.amount).toLocaleString("ar-EG")} جنيه. رقم عمليتك: ${refqaId}`
      ).catch(() => {});
    }

    res.json({ success: true, refqa_id: refqaId, message: "تم تأكيد الدفع التجريبي" });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * POST /api/payments/paymob/callback
 * Paymob webhook callback — confirms payment and finalizes donation
 */
router.post("/paymob/callback", async (req, res) => {
  try {
    const { obj, hmac } = req.body;
    if (!obj) return res.status(200).json({ ok: true });

    // Verify HMAC if secret is configured
    const settings = await getSettings();
    if (settings?.hmac_secret && hmac) {
      const valid = verifyPaymobHmac({ ...obj, hmac }, settings.hmac_secret);
      if (!valid) {
        console.warn("⚠️ Invalid Paymob HMAC signature");
        return res.status(200).json({ ok: true }); // Don't expose rejection
      }
    }

    const paymobOrderId = String(obj.order?.id || "");
    const success = obj.success === true;
    const transactionId = String(obj.id || "");

    if (!paymobOrderId) return res.status(200).json({ ok: true });

    if (success) {
      // Find by merchant_order_id (refqa_id) stored in Paymob
      const { data: donation } = await supabase
        .from("donations")
        .select("*")
        .eq("paymob_order_id", paymobOrderId)
        .single();

      if (donation && donation.status !== "approved") {
        // Confirm the donation
        await supabase
          .from("donations")
          .update({
            status: "approved",
            confirmed_at: new Date().toISOString(),
            gateway_transaction_id: transactionId,
          })
          .eq("paymob_order_id", paymobOrderId);

        // Update campaign raised amount
        if (donation.campaign_id) {
          const { data: camp } = await supabase
            .from("campaigns")
            .select("raised_amount")
            .eq("id", donation.campaign_id)
            .single();
          if (camp) {
            await supabase
              .from("campaigns")
              .update({ raised_amount: Number(camp.raised_amount) + Number(donation.amount) })
              .eq("id", donation.campaign_id);
          }
        }

        // ── Notifications: payment confirmed via Paymob webhook ──
        sendTelegramNotif(
          `✅ *تم تأكيد دفع Paymob*\n` +
          `👤 *المتبرع:* ${donation.donor_name}\n` +
          `💵 *المبلغ:* ${Number(donation.amount).toLocaleString("ar-EG")} جنيه\n` +
          `🏷 *الحملة:* ${donation.campaign_title || "عام"}\n` +
          `🔖 *Refqa:* ${donation.refqa_id}\n` +
          `🔐 *رقم المعاملة:* ${transactionId}`
        ).catch(() => {});

        if (donation.donor_phone) {
          const thankMsg =
            `🌟 السلام عليكم يا ${donation.donor_name}،\n\n` +
            `✅ تم استلام تبرعك وتأكيده بنجاح!\n\n` +
            `💰 المبلغ: ${Number(donation.amount).toLocaleString("ar-EG")} جنيه\n` +
            `📋 الحملة: ${donation.campaign_title || "تبرع عام"}\n` +
            `🔖 رقم التبرع: ${donation.refqa_id}\n\n` +
            `جزاك الله خيراً على هذا العمل الطيب، تبرعك سيصنع فرقاً في حياة كثيرين 🤍\n\n` +
            `— مؤسسة رفقاء البررة`;
          sendWhatsAppNotif(donation.donor_phone, thankMsg).catch(() => {});
        }
      }
    } else {
      // Payment failed/rejected
      await supabase
        .from("donations")
        .update({ status: "rejected" })
        .eq("paymob_order_id", paymobOrderId)
        .neq("status", "approved");
    }

    res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("Paymob callback error:", e);
    res.status(200).json({ ok: true }); // Always 200 to Paymob
  }
});

export default router;
