import { Router } from "express";
import { db } from "@workspace/db";
import { permissionTypesTable, adminUsersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

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

router.get("/", hydratePermissions, requirePermission("manage_users"), async (_req, res) => {
  try {
    const rows = await db.select().from(permissionTypesTable).orderBy(desc(permissionTypesTable.created_at));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/", hydratePermissions, requirePermission("manage_users"), async (req, res) => {
  try {
    const { name, description, permissions, color } = req.body;
    if (!name) return res.status(400).json({ message: "اسم نوع الصلاحية مطلوب" });
    const rows = await db.insert(permissionTypesTable)
      .values({ name, description, permissions: permissions || {}, color: color || "blue" })
      .returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e.message?.includes("unique")) return res.status(400).json({ message: "اسم نوع الصلاحية مستخدم بالفعل" });
    res.status(500).json({ message: e.message });
  }
});

router.patch("/:id", hydratePermissions, requirePermission("manage_users"), async (req, res) => {
  try {
    const rows = await db.update(permissionTypesTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(permissionTypesTable.id, req.params.id))
      .returning();
    if (!rows.length) return res.status(404).json({ message: "نوع الصلاحية غير موجود" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/:id", hydratePermissions, requirePermission("manage_users"), async (req, res) => {
  try {
    await db.delete(permissionTypesTable).where(eq(permissionTypesTable.id, req.params.id));
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
