import { Router } from "express";
import { db } from "@workspace/db";
import { paymentSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) return res.status(401).json({ message: "غير مصرح" });
  next();
}

// GET /api/payment-settings — get current settings (admin only, masks keys)
router.get("/", requireAuth, async (_req, res) => {
  try {
    const rows = await db.select().from(paymentSettingsTable).limit(1);
    if (rows.length === 0) {
      return res.json({ configured: false, provider: "demo", test_mode: true, is_active: false });
    }
    const s = rows[0];
    res.json({
      id: s.id,
      provider: s.provider,
      is_active: s.is_active,
      test_mode: s.test_mode,
      label: s.label,
      notes: s.notes,
      has_api_key: !!s.api_key,
      has_integration_card: !!s.integration_id_card,
      has_iframe_card: !!s.iframe_id_card,
      has_integration_wallet: !!s.integration_id_wallet,
      has_iframe_wallet: !!s.iframe_id_wallet,
      has_fawry: !!(s.fawry_merchant_code && s.fawry_security_key),
      has_hmac: !!s.hmac_secret,
      api_key_masked: s.api_key ? s.api_key.substring(0, 8) + "••••••••" : null,
      created_at: s.created_at,
      updated_at: s.updated_at,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/payment-settings/status — public status check (no auth)
router.get("/status", async (_req, res) => {
  try {
    const rows = await db.select().from(paymentSettingsTable).limit(1);
    if (rows.length === 0) {
      return res.json({ configured: false, provider: "demo", test_mode: true });
    }
    const s = rows[0];
    res.json({
      configured: s.is_active && !!s.api_key,
      provider: s.provider,
      test_mode: s.test_mode,
      is_active: s.is_active,
    });
  } catch (e: any) {
    res.status(500).json({ configured: false, provider: "demo", test_mode: true });
  }
});

// POST /api/payment-settings — create or update settings
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      provider, is_active, test_mode, label, notes,
      api_key, integration_id_card, iframe_id_card,
      integration_id_wallet, iframe_id_wallet,
      fawry_merchant_code, fawry_security_key, hmac_secret,
    } = req.body;

    const existing = await db.select().from(paymentSettingsTable).limit(1);

    const payload: any = {
      provider: provider || "demo",
      is_active: is_active ?? false,
      test_mode: test_mode ?? true,
      label: label || "بوابة الدفع الإلكتروني",
      notes: notes || null,
      updated_at: new Date(),
    };

    // Only update keys if provided (non-empty)
    if (api_key !== undefined && api_key !== "") payload.api_key = api_key;
    if (integration_id_card !== undefined) payload.integration_id_card = integration_id_card || null;
    if (iframe_id_card !== undefined) payload.iframe_id_card = iframe_id_card || null;
    if (integration_id_wallet !== undefined) payload.integration_id_wallet = integration_id_wallet || null;
    if (iframe_id_wallet !== undefined) payload.iframe_id_wallet = iframe_id_wallet || null;
    if (fawry_merchant_code !== undefined) payload.fawry_merchant_code = fawry_merchant_code || null;
    if (fawry_security_key !== undefined) payload.fawry_security_key = fawry_security_key || null;
    if (hmac_secret !== undefined) payload.hmac_secret = hmac_secret || null;

    if (existing.length === 0) {
      await db.insert(paymentSettingsTable).values(payload);
    } else {
      await db.update(paymentSettingsTable)
        .set(payload)
        .where(eq(paymentSettingsTable.id, existing[0].id));
    }

    res.json({ success: true, message: "تم حفظ إعدادات بوابة الدفع" });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/payment-settings/keys — clear API keys only (keep settings)
router.delete("/keys", requireAuth, async (_req, res) => {
  try {
    const existing = await db.select().from(paymentSettingsTable).limit(1);
    if (existing.length === 0) return res.json({ success: true });
    await db.update(paymentSettingsTable)
      .set({
        api_key: null,
        integration_id_card: null,
        iframe_id_card: null,
        integration_id_wallet: null,
        iframe_id_wallet: null,
        fawry_merchant_code: null,
        fawry_security_key: null,
        hmac_secret: null,
        is_active: false,
        updated_at: new Date(),
      })
      .where(eq(paymentSettingsTable.id, existing[0].id));
    res.json({ success: true, message: "تم مسح مفاتيح API" });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
