import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { sendTelegramNotif, sendWhatsAppNotif, sendEmailNotif } from "./notifications.js";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) {
    return res.status(401).json({ message: "غير مصرح" });
  }
  next();
}

router.get("/", async (req, res) => {
  try {
    const { status, _limit, date_from, date_to } = req.query as Record<string, string>;

    let query = supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status) as any;
    if (_limit) query = query.limit(Number(_limit)) as any;
    if (date_from) query = query.gte("created_at", date_from) as any;
    if (date_to) query = query.lte("created_at", date_to + "T23:59:59") as any;

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error) return res.status(404).json({ message: "لم يُعثر على التبرع" });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      donor_name, donor_phone, donor_email,
      campaign_id, campaign_title, amount,
      payment_method, operation_id, receipt_image_url, user_id, note,
    } = req.body;

    if (!donor_name || !donor_phone || !amount || !operation_id) {
      return res.status(400).json({ message: "بيانات التبرع غير مكتملة" });
    }

    const { data, error } = await supabase
      .from("donations")
      .insert({
        donor_name, donor_phone, donor_email,
        campaign_id, campaign_title,
        amount: Number(amount),
        payment_method: payment_method || "bank_transfer",
        operation_id, receipt_image_url, user_id, note,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    // ── Telegram notification: new donation ──
    sendTelegramNotif(
      `💰 *تبرع جديد*\n` +
      `👤 *المتبرع:* ${donor_name}\n` +
      `📱 *الهاتف:* ${donor_phone}\n` +
      `💵 *المبلغ:* ${Number(amount).toLocaleString("ar-EG")} جنيه\n` +
      `🏷 *الحملة:* ${campaign_title || "عام"}\n` +
      `💳 *طريقة الدفع:* ${payment_method || "تحويل بنكي"}\n` +
      `🔖 *رقم العملية:* ${operation_id}\n` +
      `⏳ *الحالة:* قيد المراجعة`
    ).catch(() => {});

    res.status(201).json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /:id/status — dedicated status update (used by AdminPaymentGateway)
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "حالة غير صالحة" });
    }

    // Get current donation first
    const { data: current } = await supabase.from("donations").select("*").eq("id", req.params.id).single();
    if (!current) return res.status(404).json({ message: "لم يُعثر على التبرع" });

    const updatePayload: any = { status };
    if (notes) updatePayload.notes = notes;
    if (status === "approved") updatePayload.confirmed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("donations")
      .update(updatePayload)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(404).json({ message: "لم يُعثر على التبرع" });

    // ── Update campaign raised amount on approval ──
    if (status === "approved" && current.status !== "approved" && data.campaign_id) {
      try {
        const { data: camp } = await supabase.from("campaigns").select("raised_amount").eq("id", data.campaign_id).single();
        if (camp) {
          await supabase.from("campaigns").update({ raised_amount: Number(camp.raised_amount) + Number(data.amount), updated_at: new Date().toISOString() }).eq("id", data.campaign_id);
        }
      } catch {}
    }

    // ── If un-approving, subtract from campaign ──
    if (status !== "approved" && current.status === "approved" && data.campaign_id) {
      try {
        const { data: camp } = await supabase.from("campaigns").select("raised_amount").eq("id", data.campaign_id).single();
        if (camp) {
          await supabase.from("campaigns").update({ raised_amount: Math.max(0, Number(camp.raised_amount) - Number(data.amount)) }).eq("id", data.campaign_id);
        }
      } catch {}
    }

    // ── Notifications on approval ──
    if (status === "approved" && current.status !== "approved") {
      // Telegram
      sendTelegramNotif(
        `✅ *تم اعتماد تبرع*\n` +
        `👤 *المتبرع:* ${data.donor_name}\n` +
        `💵 *المبلغ:* ${Number(data.amount).toLocaleString("ar-EG")} جنيه\n` +
        `🏷 *الحملة:* ${data.campaign_title || "عام"}\n` +
        `🔖 *رقم Refqa:* ${data.refqa_id || data.operation_id}\n` +
        (notes ? `📝 *ملاحظة:* ${notes}` : "")
      ).catch(() => {});

      // WhatsApp thank-you to donor
      if (data.donor_phone) {
        const thankYou = `شكراً لتبرعك الكريم يا ${data.donor_name}! تبرعك بمبلغ ${Number(data.amount).toLocaleString("ar-EG")} جنيه سيُغيِّر حياة كثيرين. بارك الله فيك. رقم عمليتك: ${data.refqa_id || data.operation_id}`;
        sendWhatsAppNotif(data.donor_phone, thankYou).catch(() => {});
      }

      // Email thank-you to donor
      if (data.donor_email) {
        sendEmailNotif(
          data.donor_email,
          `✅ تم تأكيد تبرعك — مؤسسة رفقاء البررة`,
          `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#2563eb">بارك الله فيك يا ${data.donor_name}!</h2>
            <p>تم استلام تبرعك واعتماده بنجاح.</p>
            <div style="background:#f3f4f6;border-radius:12px;padding:16px;margin:16px 0">
              <p style="margin:4px 0"><strong>المبلغ:</strong> ${Number(data.amount).toLocaleString("ar-EG")} جنيه</p>
              <p style="margin:4px 0"><strong>الحملة:</strong> ${data.campaign_title || "تبرع عام"}</p>
              <p style="margin:4px 0"><strong>رقم العملية:</strong> ${data.refqa_id || data.operation_id}</p>
              <p style="margin:4px 0"><strong>تاريخ التأكيد:</strong> ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <p>جزاك الله خيراً على هذا العمل الطيب. تبرعك سيصنع فرقاً في حياة كثيرين.</p>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">مؤسسة رفقاء البررة — مرخصة من وزارة التضامن الاجتماعي رقم 7932</p>
          </div>`
        ).catch(() => {});
      }
    }

    // ── Telegram notification on rejection ──
    if (status === "rejected" && current.status !== "rejected") {
      sendTelegramNotif(
        `❌ *تم رفض تبرع*\n` +
        `👤 *المتبرع:* ${data.donor_name}\n` +
        `💵 *المبلغ:* ${Number(data.amount).toLocaleString("ar-EG")} جنيه\n` +
        `🔖 *رقم:* ${data.refqa_id || data.operation_id}\n` +
        (notes ? `📝 *السبب:* ${notes}` : "")
      ).catch(() => {});
    }

    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// GET /track — public endpoint to track donations by phone (+ optional refqa_id)
router.get("/track", async (req, res) => {
  try {
    const { phone, refqa_id } = req.query as Record<string, string>;
    if (!phone) return res.status(400).json({ message: "رقم الهاتف مطلوب" });

    let query = supabase
      .from("donations")
      .select("id, refqa_id, operation_id, donor_name, donor_phone, amount, campaign_title, payment_method, status, created_at, confirmed_at, notes")
      .eq("donor_phone", phone.trim())
      .order("created_at", { ascending: false });

    if (refqa_id) {
      query = query.or(`refqa_id.eq.${refqa_id},operation_id.eq.${refqa_id}`) as any;
    }

    const { data, error } = await query.limit(20);
    if (error) throw error;
    res.json(data || []);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE /:id — admin only
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { data: current } = await supabase.from("donations").select("*").eq("id", req.params.id).single();
    if (!current) return res.status(404).json({ message: "لم يُعثر على التبرع" });

    // If donation was approved, subtract from campaign raised amount
    if (current.status === "approved" && current.campaign_id) {
      try {
        const { data: camp } = await supabase.from("campaigns").select("raised_amount").eq("id", current.campaign_id).single();
        if (camp) {
          await supabase.from("campaigns").update({ raised_amount: Math.max(0, Number(camp.raised_amount) - Number(current.amount)) }).eq("id", current.campaign_id);
        }
      } catch {}
    }

    const { error } = await supabase.from("donations").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true, message: "تم حذف التبرع بنجاح" });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { status, ...rest } = req.body;

    const { data: current } = await supabase.from("donations").select("*").eq("id", req.params.id).single();

    const { data, error } = await supabase
      .from("donations")
      .update({ status, ...rest })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(404).json({ message: "لم يُعثر على التبرع" });

    if (status === "approved" && current?.status !== "approved" && data.campaign_id) {
      try {
        const { data: camp } = await supabase.from("campaigns").select("raised_amount").eq("id", data.campaign_id).single();
        if (camp) {
          await supabase.from("campaigns").update({ raised_amount: Number(camp.raised_amount) + Number(data.amount), updated_at: new Date().toISOString() }).eq("id", data.campaign_id);
        }
      } catch {}

      // Send notifications
      sendTelegramNotif(`✅ *تم اعتماد تبرع*\n👤 ${data.donor_name} | 💵 ${Number(data.amount).toLocaleString("ar-EG")} ج | 🔖 ${data.refqa_id || data.operation_id}`).catch(() => {});
      if (data.donor_phone) {
        sendWhatsAppNotif(data.donor_phone, `شكراً لتبرعك الكريم يا ${data.donor_name}! مبلغ ${Number(data.amount).toLocaleString("ar-EG")} جنيه. رقم عمليتك: ${data.refqa_id || data.operation_id}`).catch(() => {});
      }
    }

    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
