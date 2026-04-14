import { Router } from "express";
import { db } from "@workspace/db";
import { donationsTable, paymentSettingsTable, campaignsTable } from "@workspace/db/schema";
import { eq, like, sql } from "drizzle-orm";
import crypto from "crypto";
import { sendTelegramNotif, sendWhatsAppNotif } from "./notifications.js";

const router = Router();
const PAYMOB_BASE = "https://accept.paymob.com/api";

async function getSettings() {
  const rows = await db.select().from(paymentSettingsTable).limit(1);
  return rows[0] ?? null;
}

async function generateRefqaId(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `Refqa-${dateStr}-`;

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(donationsTable)
    .where(like(donationsTable.refqa_id, `${prefix}%`));

  const count = Number(rows[0]?.count ?? 0);
  const seq = (count + 1).toString().padStart(4, "0");
  return `${prefix}${seq}`;
}

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
    const isDemoMode = !settings || !settings.is_active || !settings.api_key || settings.test_mode;

    if (isDemoMode) {
      const [donation] = await db.insert(donationsTable).values({
        donor_name,
        donor_phone,
        donor_email: donor_email || null,
        campaign_id: campaign_id || null,
        campaign_title: campaign_title || null,
        amount: String(Number(amount)),
        payment_method: "online_demo",
        operation_id: refqaId,
        refqa_id: refqaId,
        status: "pending",
      }).returning();

      return res.json({
        demo_mode: true,
        refqa_id: refqaId,
        donation_id: donation?.id,
        payment_url: null,
        message: "وضع تجريبي — لا تتم معاملات حقيقية",
      });
    }

    if (settings?.provider === "paymob") {
      const integrationId = integration_type === "wallet"
        ? settings.integration_id_wallet
        : settings.integration_id_card;
      const iframeId = integration_type === "wallet"
        ? settings.iframe_id_wallet
        : settings.iframe_id_card;

      if (!integrationId || !iframeId) {
        return res.status(503).json({
          message: `إعداد ${integration_type === "wallet" ? "المحفظة" : "بطاقة الدفع"} غير مكتمل`,
          not_configured: true,
        });
      }

      const amountCents = Math.round(Number(amount) * 100);
      const token = await getPaymobToken(settings.api_key!);

      const orderRes = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          delivery_needed: false,
          amount_cents: amountCents,
          currency: "EGP",
          merchant_order_id: refqaId,
          items: campaign_title ? [{ name: campaign_title, amount_cents: amountCents, description: `تبرع — ${campaign_title}`, quantity: 1 }] : [],
        }),
      });
      if (!orderRes.ok) throw new Error("فشل تسجيل الطلب في Paymob");
      const order = await orderRes.json() as any;

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
            country: "EG", city: "Cairo", street: "N/A", building: "N/A", floor: "N/A", apartment: "N/A",
          },
          currency: "EGP",
          integration_id: Number(integrationId),
          lock_order_when_paid: false,
        }),
      });
      if (!payKeyRes.ok) throw new Error("فشل الحصول على مفتاح الدفع");
      const payKeyData = await payKeyRes.json() as any;

      const [donation] = await db.insert(donationsTable).values({
        donor_name,
        donor_phone,
        donor_email: donor_email || null,
        campaign_id: campaign_id || null,
        campaign_title: campaign_title || null,
        amount: String(Number(amount)),
        payment_method: `online_${integration_type}`,
        operation_id: refqaId,
        refqa_id: refqaId,
        status: "pending",
        paymob_order_id: String(order.id),
      }).returning();

      return res.json({
        demo_mode: false,
        refqa_id: refqaId,
        donation_id: donation?.id,
        payment_url: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${payKeyData.token}`,
        order_id: order.id,
      });
    }

    return res.status(503).json({ message: "مزود الدفع غير مدعوم.", not_configured: true });
  } catch (e: any) {
    console.error("Payment initiate error:", e);
    res.status(500).json({ message: e.message });
  }
});

router.get("/status/:refqaId", async (req, res) => {
  try {
    const [row] = await db
      .select({
        id: donationsTable.id, refqa_id: donationsTable.refqa_id,
        status: donationsTable.status, amount: donationsTable.amount,
        donor_name: donationsTable.donor_name, campaign_title: donationsTable.campaign_title,
        confirmed_at: donationsTable.confirmed_at, created_at: donationsTable.created_at,
      })
      .from(donationsTable)
      .where(eq(donationsTable.refqa_id, req.params.refqaId))
      .limit(1);

    if (!row) return res.status(404).json({ message: "معاملة غير موجودة" });
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/demo/confirm/:refqaId", async (req, res) => {
  try {
    const { refqaId } = req.params;

    const [donation] = await db
      .select()
      .from(donationsTable)
      .where(eq(donationsTable.refqa_id, refqaId))
      .limit(1);

    if (!donation) return res.status(404).json({ message: "معاملة غير موجودة" });
    if (donation.status === "approved") return res.json({ success: true, already_confirmed: true });

    await db.update(donationsTable).set({
      status: "approved",
      confirmed_at: new Date(),
      gateway_transaction_id: `DEMO-${Date.now()}`,
    }).where(eq(donationsTable.refqa_id, refqaId));

    if (donation.campaign_id) {
      const [camp] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, donation.campaign_id)).limit(1);
      if (camp) {
        await db.update(campaignsTable).set({
          raised_amount: String(Number(camp.raised_amount) + Number(donation.amount)),
          updated_at: new Date(),
        }).where(eq(campaignsTable.id, donation.campaign_id));
      }
    }

    sendTelegramNotif(
      `✅ *تم تأكيد دفع تجريبي*\n👤 ${donation.donor_name}\n💵 ${Number(donation.amount).toLocaleString("ar-EG")} جنيه\n🔖 ${refqaId}`
    ).catch(() => {});

    if (donation.donor_phone) {
      sendWhatsAppNotif(donation.donor_phone,
        `شكراً لتبرعك الكريم يا ${donation.donor_name}! تم تأكيد تبرعك بمبلغ ${Number(donation.amount).toLocaleString("ar-EG")} جنيه. رقم عمليتك: ${refqaId}`
      ).catch(() => {});
    }

    res.json({ success: true, refqa_id: refqaId });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/paymob/callback", async (req, res) => {
  try {
    const { obj, hmac } = req.body;
    if (!obj) return res.status(200).json({ ok: true });

    const settings = await getSettings();
    if (settings?.hmac_secret && hmac) {
      const valid = verifyPaymobHmac({ ...obj, hmac }, settings.hmac_secret);
      if (!valid) return res.status(200).json({ ok: true });
    }

    const paymobOrderId = String(obj.order?.id || "");
    const success = obj.success === true;
    const transactionId = String(obj.id || "");

    if (!paymobOrderId) return res.status(200).json({ ok: true });

    if (success) {
      const [donation] = await db
        .select()
        .from(donationsTable)
        .where(eq(donationsTable.paymob_order_id, paymobOrderId))
        .limit(1);

      if (donation && donation.status !== "approved") {
        await db.update(donationsTable).set({
          status: "approved",
          confirmed_at: new Date(),
          gateway_transaction_id: transactionId,
        }).where(eq(donationsTable.paymob_order_id, paymobOrderId));

        if (donation.campaign_id) {
          const [camp] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, donation.campaign_id)).limit(1);
          if (camp) {
            await db.update(campaignsTable).set({
              raised_amount: String(Number(camp.raised_amount) + Number(donation.amount)),
              updated_at: new Date(),
            }).where(eq(campaignsTable.id, donation.campaign_id));
          }
        }

        sendTelegramNotif(
          `✅ *تم تأكيد دفع Paymob*\n👤 ${donation.donor_name}\n💵 ${Number(donation.amount).toLocaleString("ar-EG")} جنيه\n🔖 ${donation.refqa_id}\n🔐 ${transactionId}`
        ).catch(() => {});

        if (donation.donor_phone) {
          sendWhatsAppNotif(donation.donor_phone,
            `🌟 السلام عليكم يا ${donation.donor_name}،\n✅ تم استلام تبرعك وتأكيده!\n💰 المبلغ: ${Number(donation.amount).toLocaleString("ar-EG")} جنيه\n🔖 رقم التبرع: ${donation.refqa_id}\nجزاك الله خيراً 🤍`
          ).catch(() => {});
        }
      }
    } else {
      await db.update(donationsTable)
        .set({ status: "rejected" })
        .where(eq(donationsTable.paymob_order_id, paymobOrderId));
    }

    res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("Paymob callback error:", e);
    res.status(200).json({ ok: true });
  }
});

export default router;
