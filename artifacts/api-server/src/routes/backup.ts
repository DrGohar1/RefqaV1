import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

// GET /api/backup/export — export all data as JSON
router.get("/export", requireAuth, async (req, res) => {
  try {
    const format = (req.query.format as string) || "json";

    const [campaignsRes, donationsRes, settingsRes] = await Promise.all([
      supabase.from("campaigns").select("*").order("created_at"),
      supabase.from("donations").select("*").order("created_at"),
      supabase.from("settings").select("*"),
    ]);

    const backup = {
      exported_at: new Date().toISOString(),
      version: "1.0",
      organization: "رفقاء البررة",
      campaigns: campaignsRes.data || [],
      donations: donationsRes.data || [],
      settings: settingsRes.data || [],
      stats: {
        total_campaigns: (campaignsRes.data || []).length,
        total_donations: (donationsRes.data || []).length,
        total_raised: (donationsRes.data || [])
          .filter((d: any) => d.status === "approved")
          .reduce((s: number, d: any) => s + Number(d.amount), 0),
      },
    };

    if (format === "csv") {
      // Simple CSV for donations
      const headers = ["id", "donor_name", "donor_phone", "campaign_title", "amount", "status", "payment_method", "operation_id", "refqa_id", "created_at"];
      const rows = backup.donations.map((d: any) => headers.map(h => `"${(d[h] || "").toString().replace(/"/g, '""')}"`).join(","));
      const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=rafaqaa_donations_${new Date().toISOString().slice(0,10)}.csv`);
      return res.send(csv);
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=rafaqaa_backup_${new Date().toISOString().slice(0,10)}.json`);
    res.json(backup);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// GET /api/backup/stats — quick stats for display
router.get("/stats", requireAuth, async (_req, res) => {
  try {
    const [donRes, camRes] = await Promise.all([
      supabase.from("donations").select("id, status, amount, created_at").order("created_at", { ascending: false }),
      supabase.from("campaigns").select("id, status"),
    ]);
    const donations = donRes.data || [];
    const campaigns = camRes.data || [];

    res.json({
      total_donations: donations.length,
      total_campaigns: campaigns.length,
      approved_donations: donations.filter((d: any) => d.status === "approved").length,
      pending_donations: donations.filter((d: any) => d.status === "pending").length,
      total_raised: donations.filter((d: any) => d.status === "approved").reduce((s: number, d: any) => s + Number(d.amount), 0),
      last_backup: null,
    });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST /api/backup/schedule — save auto-backup schedule
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
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

router.get("/schedule", requireAuth, async (_req, res) => {
  try {
    const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "backup_schedule")).limit(1);
    res.json((row[0]?.value as any) || { frequency: "weekly", email: "", enabled: false });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

export default router;
