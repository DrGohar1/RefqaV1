import { Router } from "express";
import { db } from "@workspace/db";
import { donationsTable, campaignsTable } from "@workspace/db/schema";
import { eq, desc, gte, lte, and, sql } from "drizzle-orm";
import { sendTelegramNotif, sendWhatsAppNotif } from "./notifications.js";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

router.get("/", async (req, res) => {
  try {
    const { status, _limit, date_from, date_to, operation_id, donor_phone } = req.query as Record<string, string>;

    const conditions: any[] = [];
    if (status) conditions.push(eq(donationsTable.status, status));
    if (date_from) conditions.push(gte(donationsTable.created_at, new Date(date_from)));
    if (date_to) conditions.push(lte(donationsTable.created_at, new Date(date_to + "T23:59:59")));

    let query = db
      .select()
      .from(donationsTable)
      .orderBy(desc(donationsTable.created_at))
      .where(conditions.length ? and(...conditions) : undefined) as any;

    if (_limit) query = query.limit(Number(_limit));

    let data = await query;

    // Filter by operation_id or donor_phone (for tracking page)
    if (operation_id) {
      data = data.filter((d: any) =>
        d.operation_id?.toLowerCase().includes(operation_id.toLowerCase()) ||
        d.refqa_id?.toLowerCase().includes(operation_id.toLowerCase())
      );
    }
    if (donor_phone) {
      data = data.filter((d: any) => d.donor_phone?.includes(donor_phone));
    }

    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});


// GET /donations/track — public donor tracking by phone
router.get("/track", async (req, res) => {
  try {
    const { phone, refqa_id } = req.query as Record<string, string>;
    if (!phone) return res.status(400).json({ message: "رقم الهاتف مطلوب" });

    let data = await db
      .select()
      .from(donationsTable)
      .orderBy(desc(donationsTable.created_at))
      .where(eq(donationsTable.donor_phone, phone.trim()));

    if (refqa_id?.trim()) {
      data = data.filter(d =>
        d.refqa_id?.toLowerCase().includes(refqa_id.trim().toLowerCase()) ||
        d.operation_id?.toLowerCase().includes(refqa_id.trim().toLowerCase())
      );
    }

    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(donationsTable)
      .where(eq(donationsTable.id, req.params.id))
      .limit(1);
    if (!row) return res.status(404).json({ message: "لم يُعثر على التبرع" });
    res.json(row);
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

    const [row] = await db
      .insert(donationsTable)
      .values({
        donor_name,
        donor_phone,
        donor_email: donor_email || null,
        campaign_id: campaign_id || null,
        campaign_title: campaign_title || null,
        amount: String(Number(amount)),
        payment_method: payment_method || "bank_transfer",
        operation_id,
        refqa_id: operation_id,
        receipt_image_url: receipt_image_url || null,
        user_id: user_id || null,
        note: note || null,
        status: "pending",
      })
      .returning();

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

    res.status(201).json(row);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "حالة غير صالحة" });
    }

    const [current] = await db
      .select()
      .from(donationsTable)
      .where(eq(donationsTable.id, req.params.id))
      .limit(1);
    if (!current) return res.status(404).json({ message: "لم يُعثر على التبرع" });

    const updates: any = { status };
    if (notes) updates.note = notes;
    if (status === "approved") updates.confirmed_at = new Date();

    const [updated] = await db
      .update(donationsTable)
      .set(updates)
      .where(eq(donationsTable.id, req.params.id))
      .returning();

    if (status === "approved" && current.status !== "approved" && updated.campaign_id) {
      try {
        const [camp] = await db
          .select()
          .from(campaignsTable)
          .where(eq(campaignsTable.id, updated.campaign_id))
          .limit(1);
        if (camp) {
          await db
            .update(campaignsTable)
            .set({
              raised_amount: String(Number(camp.raised_amount) + Number(updated.amount)),
              updated_at: new Date(),
            })
            .where(eq(campaignsTable.id, updated.campaign_id));
        }
      } catch {}

      sendTelegramNotif(
        `✅ *تم اعتماد تبرع*\n👤 ${updated.donor_name} | 💵 ${Number(updated.amount).toLocaleString("ar-EG")} ج | 🔖 ${updated.refqa_id || updated.operation_id}`
      ).catch(() => {});

      if (updated.donor_phone) {
        sendWhatsAppNotif(
          updated.donor_phone,
          `شكراً لتبرعك الكريم يا ${updated.donor_name}! مبلغ ${Number(updated.amount).toLocaleString("ar-EG")} جنيه. رقم عمليتك: ${updated.refqa_id || updated.operation_id}`
        ).catch(() => {});
      }
    }

    if (status === "rejected" && current.status === "approved" && updated.campaign_id) {
      try {
        const [camp] = await db
          .select()
          .from(campaignsTable)
          .where(eq(campaignsTable.id, updated.campaign_id))
          .limit(1);
        if (camp) {
          await db
            .update(campaignsTable)
            .set({
              raised_amount: String(Math.max(0, Number(camp.raised_amount) - Number(current.amount))),
              updated_at: new Date(),
            })
            .where(eq(campaignsTable.id, updated.campaign_id));
        }
      } catch {}
    }

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { status, ...rest } = req.body;

    const [current] = await db
      .select()
      .from(donationsTable)
      .where(eq(donationsTable.id, req.params.id))
      .limit(1);

    const updates: any = { ...rest };
    if (status) updates.status = status;
    if (status === "approved" && current?.status !== "approved") {
      updates.confirmed_at = new Date();
    }

    const [updated] = await db
      .update(donationsTable)
      .set(updates)
      .where(eq(donationsTable.id, req.params.id))
      .returning();

    if (!updated) return res.status(404).json({ message: "لم يُعثر على التبرع" });

    if (status === "approved" && current?.status !== "approved" && updated.campaign_id) {
      try {
        const [camp] = await db
          .select()
          .from(campaignsTable)
          .where(eq(campaignsTable.id, updated.campaign_id))
          .limit(1);
        if (camp) {
          await db
            .update(campaignsTable)
            .set({
              raised_amount: String(Number(camp.raised_amount) + Number(updated.amount)),
              updated_at: new Date(),
            })
            .where(eq(campaignsTable.id, updated.campaign_id));
        }
      } catch {}

      sendTelegramNotif(
        `✅ *تم اعتماد تبرع*\n👤 ${updated.donor_name} | 💵 ${Number(updated.amount).toLocaleString("ar-EG")} ج | 🔖 ${updated.refqa_id || updated.operation_id}`
      ).catch(() => {});
      if (updated.donor_phone) {
        sendWhatsAppNotif(
          updated.donor_phone,
          `شكراً لتبرعك الكريم يا ${updated.donor_name}! مبلغ ${Number(updated.amount).toLocaleString("ar-EG")} جنيه. رقم عمليتك: ${updated.refqa_id || updated.operation_id}`
        ).catch(() => {});
      }
    }

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(donationsTable).where(eq(donationsTable.id, req.params.id));
    res.json({ success: true, message: "تم حذف التبرع بنجاح" });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
