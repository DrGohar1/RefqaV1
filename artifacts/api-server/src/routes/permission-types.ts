import { Router } from "express";
import { db } from "@workspace/db";
import { permissionTypesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

router.get("/", requireAuth, async (_req, res) => {
  try {
    const rows = await db.select().from(permissionTypesTable).orderBy(desc(permissionTypesTable.created_at));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, description, permissions, color } = req.body;
    if (!name) return res.status(400).json({ message: "اسم نوع الصلاحية مطلوب" });

    const rows = await db
      .insert(permissionTypesTable)
      .values({ name, description, permissions: permissions || {}, color: color || "blue" })
      .returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e.message?.includes("unique")) return res.status(400).json({ message: "اسم نوع الصلاحية مستخدم بالفعل" });
    res.status(500).json({ message: e.message });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .update(permissionTypesTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(permissionTypesTable.id, req.params.id))
      .returning();
    if (!rows.length) return res.status(404).json({ message: "نوع الصلاحية غير موجود" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(permissionTypesTable).where(eq(permissionTypesTable.id, req.params.id));
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
