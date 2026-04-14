import { Router } from "express";
import { db } from "@workspace/db";
import { adminUsersTable, permissionTypesTable } from "@workspace/db/schema";
import { supabase } from "../lib/supabase.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

declare module "express-session" {
  interface SessionData {
    user?: { id: string; username: string; role: string; display_name?: string; permissions?: Record<string, boolean> };
  }
}

// ===== Seeding defaults =====
async function ensureDefaults() {
  try {
    // Default permission types
    const types = await db.select().from(permissionTypesTable);
    if (types.length === 0) {
      const defaults = [
        {
          name: "مدير كامل",
          description: "صلاحيات كاملة على جميع الأقسام",
          permissions: {
            manage_campaigns: true, manage_donations: true, manage_settings: true,
            manage_users: true, manage_banners: true, view_reports: true,
            approve_donations: true, delete_records: true,
          },
          color: "red",
        },
        {
          name: "مشرف تبرعات",
          description: "إدارة التبرعات والمراجعة والاعتماد",
          permissions: {
            manage_campaigns: false, manage_donations: true, manage_settings: false,
            manage_users: false, manage_banners: false, view_reports: true,
            approve_donations: true, delete_records: false,
          },
          color: "blue",
        },
        {
          name: "متابع فقط",
          description: "عرض البيانات فقط بدون أي تعديل",
          permissions: {
            manage_campaigns: false, manage_donations: false, manage_settings: false,
            manage_users: false, manage_banners: false, view_reports: true,
            approve_donations: false, delete_records: false,
          },
          color: "gray",
        },
      ];
      for (const d of defaults) {
        await db.insert(permissionTypesTable).values(d).onConflictDoNothing();
      }
    }

    // Default admin user
    const admins = await db.select().from(adminUsersTable);
    if (admins.length === 0) {
      const [fullRole] = await db.select().from(permissionTypesTable).where(eq(permissionTypesTable.name, "مدير كامل"));
      const hash = await bcrypt.hash("admin123", 10);
      await db.insert(adminUsersTable).values({
        username: "admin",
        password_hash: hash,
        display_name: "المدير الرئيسي",
        permission_type_id: fullRole?.id,
        is_active: true,
      }).onConflictDoNothing();
    }
  } catch {}
}

// Run seeding once on startup
ensureDefaults();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "يُرجى إدخال اسم المستخدم وكلمة المرور" });
    }

    // Look up in admin_users table
    const [user] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.username, username))
      .limit(1);

    if (user) {
      if (!user.is_active) {
        return res.status(401).json({ message: "هذا الحساب موقوف، تواصل مع المدير" });
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });

      // Get permissions
      let permissions: Record<string, boolean> = {};
      if (user.permission_type_id) {
        const [pt] = await db.select().from(permissionTypesTable).where(eq(permissionTypesTable.id, user.permission_type_id));
        permissions = (pt?.permissions as Record<string, boolean>) || {};
      }

      const sessionUser = {
        id: user.id,
        username: user.username,
        display_name: user.display_name || user.username,
        role: permissions.manage_users ? "admin" : "moderator",
        permissions,
      };

      (req.session as any).user = sessionUser;
      await db.update(adminUsersTable).set({ last_login: new Date() }).where(eq(adminUsersTable.id, user.id));
      await new Promise<void>((resolve, reject) =>
        req.session.save((err) => (err ? reject(err) : resolve()))
      );
      return res.json({ user: sessionUser });
    }

    return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

router.get("/me", (req, res) => {
  const user = (req.session as any).user;
  if (!user) return res.json({ user: null });
  res.json({ user });
});

router.post("/change-password", async (req, res) => {
  const sessionUser = (req.session as any).user;
  if (!sessionUser) return res.status(401).json({ message: "غير مصرح" });

  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "يُرجى ملء جميع الحقول" });
    if (newPassword.length < 6) return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });

    const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, sessionUser.id));
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ message: "كلمة المرور الحالية غير صحيحة" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(adminUsersTable).set({ password_hash: newHash, updated_at: new Date() }).where(eq(adminUsersTable.id, user.id));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
