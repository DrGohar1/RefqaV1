import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

router.get("/:key", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, req.params.key))
      .limit(1);

    if (!rows.length) return res.json({ value: null });
    res.json({ value: rows[0].value });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/:key", requireAuth, async (req, res) => {
  try {
    const { value } = req.body;

    const existing = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, req.params.key))
      .limit(1);

    if (existing.length) {
      await db
        .update(settingsTable)
        .set({ value, updated_at: new Date() })
        .where(eq(settingsTable.key, req.params.key));
    } else {
      await db
        .insert(settingsTable)
        .values({ key: req.params.key, value });
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
