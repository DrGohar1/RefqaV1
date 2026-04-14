import { Router } from "express";
import { db } from "@workspace/db";
import { bannersTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

// Public: get active banners
router.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(bannersTable)
      .orderBy(asc(bannersTable.display_order));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, subtitle, badge_text, image_url, link_url, link_text, bg_color, display_order } = req.body;
    if (!title) return res.status(400).json({ message: "العنوان مطلوب" });

    const rows = await db
      .insert(bannersTable)
      .values({ title, subtitle, badge_text, image_url, link_url, link_text, bg_color: bg_color || "primary", display_order: display_order || 0, is_active: true })
      .returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .update(bannersTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(bannersTable.id, req.params.id))
      .returning();
    if (!rows.length) return res.status(404).json({ message: "البانر غير موجود" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(bannersTable).where(eq(bannersTable.id, req.params.id));
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
