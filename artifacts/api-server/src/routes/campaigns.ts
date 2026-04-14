import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

router.get("/", async (_req, res) => {
  try {
    const data = await db
      .select()
      .from(campaignsTable)
      .orderBy(desc(campaignsTable.created_at));
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, req.params.id))
      .limit(1);
    if (!row) return res.status(404).json({ message: "لم يُعثر على الحملة" });
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, goal_amount, image_url, category, days_left } = req.body;
    if (!title) return res.status(400).json({ message: "العنوان مطلوب" });

    const [row] = await db
      .insert(campaignsTable)
      .values({
        title,
        description,
        goal_amount: String(Number(goal_amount || 0)),
        raised_amount: "0",
        image_url,
        category: category || "general",
        days_left,
        status: "active",
      })
      .returning();

    res.status(201).json(row);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const updates: any = { ...req.body, updated_at: new Date() };
    if (updates.goal_amount !== undefined) updates.goal_amount = String(Number(updates.goal_amount));
    if (updates.raised_amount !== undefined) updates.raised_amount = String(Number(updates.raised_amount));

    const [row] = await db
      .update(campaignsTable)
      .set(updates)
      .where(eq(campaignsTable.id, req.params.id))
      .returning();

    if (!row) return res.status(404).json({ message: "لم يُعثر على الحملة" });
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(campaignsTable).where(eq(campaignsTable.id, req.params.id));
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
