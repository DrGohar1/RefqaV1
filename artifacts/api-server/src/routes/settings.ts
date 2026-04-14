import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) {
    return res.status(401).json({ message: "غير مصرح" });
  }
  next();
}

router.get("/:key", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", req.params.key)
      .single();

    if (error || !data) return res.json({ value: null });
    res.json({ value: data.value });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/:key", requireAuth, async (req, res) => {
  try {
    const { value } = req.body;

    const { error } = await supabase
      .from("settings")
      .upsert(
        { key: req.params.key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
