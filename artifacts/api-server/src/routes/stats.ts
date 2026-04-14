import { Router } from "express";
import { db } from "@workspace/db";
import { donationsTable, campaignsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [donations, campaigns] = await Promise.all([
      db.select({
        amount: donationsTable.amount,
        status: donationsTable.status,
        donor_phone: donationsTable.donor_phone,
      }).from(donationsTable),
      db.select({ id: campaignsTable.id }).from(campaignsTable),
    ]);

    const approved = donations.filter((d) => d.status === "approved");
    const totalRaised = approved.reduce((s, d) => s + Number(d.amount), 0);
    const uniquePhones = new Set(donations.map((d) => d.donor_phone)).size;

    res.json({
      donors: uniquePhones,
      totalRaised,
      campaigns: campaigns.length,
      beneficiaries: Math.floor(totalRaised / 150),
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
