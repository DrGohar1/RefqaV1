import { Router } from "express";
import { db } from "@workspace/db";
import { fieldOrdersTable, agentsTable } from "@workspace/db/schema";
import { eq, desc, asc } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

// Public: POST create field order (from donation modal - home delivery)
router.post("/", async (req, res) => {
  try {
    const {
      donor_name, donor_phone, address, zone, preferred_time,
      amount, campaign_id, campaign_title, order_type = "home_delivery", notes,
    } = req.body;

    if (!donor_name || !donor_phone || !amount) {
      return res.status(400).json({ message: "الاسم والهاتف والمبلغ مطلوبة" });
    }

    const [row] = await db.insert(fieldOrdersTable).values({
      order_type,
      donor_name,
      donor_phone,
      address,
      zone,
      preferred_time,
      amount: String(amount),
      campaign_id,
      campaign_title,
      status: "pending",
      notes,
    }).returning();

    res.status(201).json(row);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// Admin: GET all field orders
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, order_type } = req.query as Record<string, string>;
    let query = db.select().from(fieldOrdersTable).orderBy(desc(fieldOrdersTable.created_at));
    const rows = await query;
    const filtered = rows.filter(r => {
      if (status && r.status !== status) return false;
      if (order_type && r.order_type !== order_type) return false;
      return true;
    });
    res.json(filtered);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// Admin: GET single order
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [row] = await db.select().from(fieldOrdersTable).where(eq(fieldOrdersTable.id, req.params.id));
    if (!row) return res.status(404).json({ message: "الطلب غير موجود" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// Admin: PATCH update field order (assign agent, change status, add notes)
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { agent_id, status, admin_notes, ...rest } = req.body;
    const updateData: any = { ...rest, updated_at: new Date() };

    if (status) updateData.status = status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    if (agent_id) {
      updateData.agent_id = agent_id;
      // Fetch agent name
      const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, agent_id));
      if (agent) {
        updateData.agent_name = agent.name;
        if (!status) updateData.status = "assigned";
      }
    }

    if (status === "collected") {
      updateData.collected_at = new Date();
    }

    const [row] = await db.update(fieldOrdersTable).set(updateData).where(eq(fieldOrdersTable.id, req.params.id)).returning();
    if (!row) return res.status(404).json({ message: "الطلب غير موجود" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// Admin: DELETE
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(fieldOrdersTable).where(eq(fieldOrdersTable.id, req.params.id));
    res.status(204).send();
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

// Agent: GET my orders (for future agent portal)
router.get("/agent/my-orders", async (req, res) => {
  try {
    const agent = (req.session as any).agent;
    if (!agent) return res.status(401).json({ message: "غير مصرح" });
    const rows = await db.select().from(fieldOrdersTable)
      .where(eq(fieldOrdersTable.agent_id, agent.id))
      .orderBy(desc(fieldOrdersTable.created_at));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ message: e.message }); }
});

export default router;
