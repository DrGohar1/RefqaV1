import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable, donationsTable, settingsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

router.get("/export", requireAuth, async (req, res) => {
  try {
    const format = (req.query.format as string) || "json";

    const [campaigns, donations, settings] = await Promise.all([
      db.select().from(campaignsTable).orderBy(asc(campaignsTable.created_at)),
      db.select().from(donationsTable).orderBy(asc(donationsTable.created_at)),
      db.select().from(settingsTable),
    ]);

    const backup = {
      exported_at: new Date().toISOString(),
      version: "2.0",
      organization: "رفقاء البررة",
      campaigns,
      donations,
      settings,
      stats: {
        total_campaigns: campaigns.length,
        total_donations: donations.length,
        total_raised: donations
          .filter((d) => d.status === "approved")
          .reduce((s, d) => s + Number(d.amount), 0),
      },
    };

    if (format === "csv") {
      const headers = ["id", "donor_name", "donor_phone", "campaign_title", "amount", "status", "payment_method", "operation_id", "refqa_id", "created_at"];
      const rows = backup.donations.map((d: any) =>
        headers.map((h) => `"${(d[h] || "").toString().replace(/"/g, '""')}"`).join(",")
      );
      const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=rafaqaa_donations_${new Date().toISOString().slice(0, 10)}.csv`);
      return res.send(csv);
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=rafaqaa_backup_${new Date().toISOString().slice(0, 10)}.json`);
    res.json(backup);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/stats", requireAuth, async (_req, res) => {
  try {
    const [donations, campaigns] = await Promise.all([
      db.select({ id: donationsTable.id, status: donationsTable.status, amount: donationsTable.amount, created_at: donationsTable.created_at }).from(donationsTable),
      db.select({ id: campaignsTable.id, status: campaignsTable.status }).from(campaignsTable),
    ]);

    res.json({
      total_donations: donations.length,
      total_campaigns: campaigns.length,
      approved_donations: donations.filter((d) => d.status === "approved").length,
      pending_donations: donations.filter((d) => d.status === "pending").length,
      total_raised: donations.filter((d) => d.status === "approved").reduce((s, d) => s + Number(d.amount), 0),
      last_backup: null,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/schedule", requireAuth, async (req, res) => {
  try {
    const { frequency, email, enabled } = req.body;
    const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, "backup_schedule")).limit(1);
    const payload = { frequency, email, enabled, updated_at: new Date().toISOString() };
    if (existing.length) {
      await db.update(settingsTable).set({ value: payload, updated_at: new Date() }).where(eq(settingsTable.key, "backup_schedule"));
    } else {
      await db.insert(settingsTable).values({ key: "backup_schedule", value: payload });
    }
    res.json({ success: true, message: "تم حفظ جدول النسخ الاحتياطي" });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/schedule", requireAuth, async (_req, res) => {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "backup_schedule")).limit(1);
    res.json((row?.value as any) || { frequency: "weekly", email: "", enabled: false });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
