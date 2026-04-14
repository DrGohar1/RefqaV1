import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [{ data: donations }, { data: campaigns }] = await Promise.all([
      supabase.from("donations").select("amount, status, donor_phone"),
      supabase.from("campaigns").select("id"),
    ]);

    const allDonations = donations || [];
    const approved = allDonations.filter((d: any) => d.status === "approved");
    const totalRaised = approved.reduce((s: number, d: any) => s + Number(d.amount), 0);
    const uniquePhones = new Set(allDonations.map((d: any) => d.donor_phone)).size;

    res.json({
      donors: uniquePhones,
      totalRaised,
      campaigns: (campaigns || []).length,
      beneficiaries: Math.floor(totalRaised / 150),
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
