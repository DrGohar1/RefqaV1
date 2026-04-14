import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) {
    return res.status(401).json({ message: "غير مصرح" });
  }
  next();
}

router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error) return res.status(404).json({ message: "لم يُعثر على الحملة" });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, goal_amount, image_url, category, days_left } = req.body;
    if (!title) return res.status(400).json({ message: "العنوان مطلوب" });

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        title,
        description,
        goal_amount: Number(goal_amount || 0),
        raised_amount: 0,
        image_url,
        category: category || "general",
        days_left,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return res.status(404).json({ message: "لم يُعثر على الحملة" });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
