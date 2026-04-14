import { Router } from "express";
import { db } from "@workspace/db";
import { agentsTable, fieldOrdersTable } from "@workspace/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

// GET all agents (admin)
router.get("/", requireAuth, async (_req, res) => {
  try {
    const rows = await db.select({
      id: agentsTable.id,
      name: agentsTable.name,
      phone: agentsTable.phone,
      zone: agentsTable.zone,
      username: agentsTable.username,
      is_active: agentsTable.is_active,
      total_collected: agentsTable.total_collected,
      notes: agentsTable.notes,
      created_at: agentsTable.created_at,
    }).from(agentsTable).orderBy(asc(agentsTable.name));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// GET agent field orders (طلبات مندوب معين)
router.get("/:id/orders", requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(fieldOrdersTable)
      .where(eq(fieldOrdersTable.agent_id, req.params.id))
      .orderBy(desc(fieldOrdersTable.created_at));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// GET single agent
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [row] = await db.select().from(agentsTable).where(eq(agentsTable.id, req.params.id));
    if (!row) return res.status(404).json({ message: "المندوب غير موجود" });
    const { password_hash, ...safe } = row;
    res.json(safe);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST create agent
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, phone, zone, username, password, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ message: "الاسم والهاتف مطلوبان" });

    const insertData: any = { name, phone, zone, username, notes, is_active: true };
    if (password) insertData.password_hash = await bcrypt.hash(password, 10);

    const [row] = await db.insert(agentsTable).values(insertData).returning();
    const { password_hash, ...safe } = row;
    res.status(201).json(safe);
  } catch (e: any) {
    if (e.message?.includes("unique")) return res.status(409).json({ message: "اسم المستخدم مستخدم بالفعل" });
    res.status(500).json({ message: e.message });
  }
});

// PATCH update agent
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updateData: any = { ...rest, updated_at: new Date() };
    if (password) updateData.password_hash = await bcrypt.hash(password, 10);

    const [row] = await db.update(agentsTable).set(updateData).where(eq(agentsTable.id, req.params.id)).returning();
    if (!row) return res.status(404).json({ message: "المندوب غير موجود" });
    const { password_hash, ...safe } = row;
    res.json(safe);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// PATCH update total_collected manually
router.patch("/:id/collected", requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount === undefined) return res.status(400).json({ message: "المبلغ مطلوب" });
    const [row] = await db.update(agentsTable)
      .set({ total_collected: String(amount), updated_at: new Date() } as any)
      .where(eq(agentsTable.id, req.params.id))
      .returning();
    if (!row) return res.status(404).json({ message: "المندوب غير موجود" });
    const { password_hash, ...safe } = row;
    res.json(safe);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// DELETE agent
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(agentsTable).where(eq(agentsTable.id, req.params.id));
    res.status(204).send();
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// POST /agents/login — agent login (public)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "البيانات مطلوبة" });

    const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.username, username));
    if (!agent || !agent.is_active) return res.status(401).json({ message: "بيانات دخول خاطئة أو الحساب موقوف" });
    if (!agent.password_hash) return res.status(401).json({ message: "لا يوجد كلمة مرور لهذا الحساب" });

    const valid = await bcrypt.compare(password, agent.password_hash);
    if (!valid) return res.status(401).json({ message: "كلمة المرور غير صحيحة" });

    (req.session as any).agent = { id: agent.id, name: agent.name, zone: agent.zone };
    res.json({ ok: true, agent: { id: agent.id, name: agent.name, zone: agent.zone } });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

export default router;
