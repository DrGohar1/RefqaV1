import { Router } from "express";
import { db } from "@workspace/db";
import { adminUsersTable, permissionTypesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

// ── فاحص الصلاحيات المركزي ──
function isSuperAdmin(user: any): boolean {
  return (
    user?.permissions?.manage_users === true &&
    user?.permissions?.manage_settings === true &&
    user?.permissions?.manage_campaigns === true
  );
}

function requirePermission(permission: string) {
  return (req: any, res: any, next: any) => {
    const user = (req.session as any)?.user;
    if (!user) return res.status(401).json({ message: "غير مصرح" });
    if (!isSuperAdmin(user) && user.permissions?.[permission] !== true) {
      return res.status(403).json({ message: "ليس لديك صلاحية لتنفيذ هذا الإجراء" });
    }
    next();
  };
}

// ── إعادة تحميل الصلاحيات من قاعدة البيانات في كل طلب ──
async function hydratePermissions(req: any, _res: any, next: any) {
  const sessionUser = (req.session as any)?.user;
  if (!sessionUser?.id) return next();
  try {
    const [dbUser] = await db.select().from(adminUsersTable)
      .where(eq(adminUsersTable.id, sessionUser.id)).limit(1);
    if (dbUser?.permission_type_id) {
      const [pt] = await db.select().from(permissionTypesTable)
        .where(eq(permissionTypesTable.id, dbUser.permission_type_id)).limit(1);
      (req.session as any).user.permissions = (pt?.permissions as Record<string, boolean>) || {};
    } else {
      (req.session as any).user.permissions = {};
    }
  } catch {}
  next();
}

// GET all admin users (without password_hash)
router.get("/", hydratePermissions, requirePermission("manage_users"), async (_req, res) => {
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
router.post("/", hydratePermissions, requirePermission("manage_users"), async (req, res) => {
  try {
    const { username, password, display_name, permission_type_id } = req.body;
    if (!username || !password) return res.status(400).json({ message: "اسم المستخدم وكلمة المرور مطلوبان" });
    if (password.length < 6) return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });

    const hash = await bcrypt.hash(password, 10);
    const rows = await db.insert(adminUsersTable).values({
      username, password_hash: hash, display_name, permission_type_id, is_active: true,
    }).returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e.message?.includes("unique")) return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });
    res.status(500).json({ message: e.message });
  }
});

// PATCH update admin user
router.patch("/:id", hydratePermissions, requirePermission("manage_users"), async (req, res) => {
  try {
    const updates: any = { ...req.body, updated_at: new Date() };
    if (updates.password) {
      updates.password_hash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }
    const rows = await db.update(adminUsersTable).set(updates)
      .where(eq(adminUsersTable.id, req.params.id)).returning();
    if (!rows.length) return res.status(404).json({ message: "المستخدم غير موجود" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE admin user
router.delete("/:id", hydratePermissions, requirePermission("manage_users"), async (req, res) => {
  try {
    await db.delete(adminUsersTable).where(eq(adminUsersTable.id, req.params.id));
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
