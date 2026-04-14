import { Router } from "express";
import { db } from "@workspace/db";
import { adminUsersTable, permissionTypesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

// GET all admin users (without password_hash)
router.get("/", requireAuth, async (_req, res) => {
  try {
    const users = await db
      .select({
        id: adminUsersTable.id,
        username: adminUsersTable.username,
        display_name: adminUsersTable.display_name,
        permission_type_id: adminUsersTable.permission_type_id,
        is_active: adminUsersTable.is_active,
        last_login: adminUsersTable.last_login,
        created_at: adminUsersTable.created_at,
      })
      .from(adminUsersTable)
      .orderBy(desc(adminUsersTable.created_at));

    // Attach permission type name
    const permTypes = await db.select().from(permissionTypesTable);
    const result = users.map((u) => ({
      ...u,
      permission_type: permTypes.find((p) => p.id === u.permission_type_id) || null,
    }));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// POST create admin user
router.post("/", requireAuth, async (req, res) => {
  try {
    const { username, password, display_name, permission_type_id } = req.body;
    if (!username || !password) return res.status(400).json({ message: "اسم المستخدم وكلمة المرور مطلوبان" });
    if (password.length < 6) return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });

    const hash = await bcrypt.hash(password, 10);
    const rows = await db
      .insert(adminUsersTable)
      .values({ username, password_hash: hash, display_name, permission_type_id, is_active: true })
      .returning();

    const { password_hash: _, ...user } = rows[0];
    res.status(201).json(user);
  } catch (e: any) {
    if (e.message?.includes("unique")) return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });
    res.status(500).json({ message: e.message });
  }
});

// PATCH update admin user
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updates: any = { ...rest, updated_at: new Date() };
    if (password) {
      if (password.length < 6) return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    const rows = await db
      .update(adminUsersTable)
      .set(updates)
      .where(eq(adminUsersTable.id, req.params.id))
      .returning();

    if (!rows.length) return res.status(404).json({ message: "المستخدم غير موجود" });
    const { password_hash: _, ...user } = rows[0];
    res.json(user);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE admin user
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(adminUsersTable).where(eq(adminUsersTable.id, req.params.id));
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
