import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;
    res.json(data || []);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { action, table_name, record_id } = req.body;
    if (!action) return res.status(400).json({ message: "action مطلوب" });

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({ action, table_name, record_id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
