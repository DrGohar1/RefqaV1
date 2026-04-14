import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const data = await db
      .select()
      .from(auditLogsTable)
      .orderBy(desc(auditLogsTable.created_at))
      .limit(200);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { action, table_name, record_id } = req.body;
    if (!action) return res.status(400).json({ message: "action مطلوب" });

    const [row] = await db
      .insert(auditLogsTable)
      .values({ action, table_name, record_id })
      .returning();

    res.status(201).json(row);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
