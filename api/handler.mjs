var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// artifacts/api-server/src/app.ts
import express from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";

// artifacts/api-server/src/routes/index.ts
import { Router as Router19 } from "express";

// artifacts/api-server/src/routes/health.ts
import { Router } from "express";

// lib/api-zod/src/generated/api.ts
import * as zod from "zod";
var HealthCheckResponse = zod.object({
  status: zod.string()
});

// artifacts/api-server/src/routes/health.ts
var router = Router();
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});
var health_default = router;

// artifacts/api-server/src/routes/auth.ts
import { Router as Router2 } from "express";

// lib/db/src/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// lib/db/src/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  adminUsersTable: () => adminUsersTable,
  agentsTable: () => agentsTable,
  auditLogsTable: () => auditLogsTable,
  bannersTable: () => bannersTable,
  campaignsTable: () => campaignsTable,
  donationsTable: () => donationsTable,
  fieldOrdersTable: () => fieldOrdersTable,
  insertAdminUserSchema: () => insertAdminUserSchema,
  insertAgentSchema: () => insertAgentSchema,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertBannerSchema: () => insertBannerSchema,
  insertCampaignSchema: () => insertCampaignSchema,
  insertDonationSchema: () => insertDonationSchema,
  insertFieldOrderSchema: () => insertFieldOrderSchema,
  insertPermissionTypeSchema: () => insertPermissionTypeSchema,
  insertSettingSchema: () => insertSettingSchema,
  paymentSettingsTable: () => paymentSettingsTable,
  permissionTypesTable: () => permissionTypesTable,
  settingsTable: () => settingsTable
});
import {
  pgTable,
  text,
  uuid,
  numeric,
  timestamp,
  jsonb,
  integer,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var campaignsTable = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  goal_amount: numeric("goal_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  raised_amount: numeric("raised_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  image_url: text("image_url"),
  category: text("category").default("general"),
  status: text("status").notNull().default("active"),
  days_left: integer("days_left"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});
var donationsTable = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  donor_name: text("donor_name").notNull(),
  donor_phone: text("donor_phone").notNull(),
  donor_email: text("donor_email"),
  campaign_id: uuid("campaign_id"),
  campaign_title: text("campaign_title"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  payment_method: text("payment_method").notNull().default("bank_transfer"),
  operation_id: text("operation_id").notNull(),
  receipt_image_url: text("receipt_image_url"),
  status: text("status").notNull().default("pending"),
  user_id: text("user_id"),
  note: text("note"),
  paymob_order_id: text("paymob_order_id"),
  refqa_id: text("refqa_id"),
  gateway_transaction_id: text("gateway_transaction_id"),
  confirmed_at: timestamp("confirmed_at"),
  created_at: timestamp("created_at").notNull().defaultNow()
});
var settingsTable = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});
var auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: text("action").notNull(),
  table_name: text("table_name"),
  record_id: text("record_id"),
  created_at: timestamp("created_at").notNull().defaultNow()
});
var permissionTypesTable = pgTable("permission_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().default("{}"),
  color: text("color").default("blue"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});
var adminUsersTable = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  display_name: text("display_name"),
  permission_type_id: uuid("permission_type_id"),
  is_active: boolean("is_active").notNull().default(true),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});
var bannersTable = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  badge_text: text("badge_text"),
  image_url: text("image_url"),
  link_url: text("link_url"),
  link_text: text("link_text"),
  bg_color: text("bg_color").default("primary"),
  display_order: integer("display_order").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});
var agentsTable = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  zone: text("zone"),
  username: text("username").unique(),
  password_hash: text("password_hash"),
  is_active: boolean("is_active").notNull().default(true),
  total_collected: numeric("total_collected", { precision: 12, scale: 2 }).default("0"),
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});
var fieldOrdersTable = pgTable("field_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_type: text("order_type").notNull().default("home_delivery"),
  // home_delivery | agent
  donor_name: text("donor_name").notNull(),
  donor_phone: text("donor_phone").notNull(),
  address: text("address"),
  zone: text("zone"),
  preferred_time: text("preferred_time"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  campaign_id: text("campaign_id"),
  campaign_title: text("campaign_title"),
  agent_id: uuid("agent_id"),
  agent_name: text("agent_name"),
  status: text("status").notNull().default("pending"),
  // pending | assigned | collected | failed | cancelled
  notes: text("notes"),
  admin_notes: text("admin_notes"),
  collected_at: timestamp("collected_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});
var paymentSettingsTable = pgTable("payment_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull().default("demo"),
  // demo | paymob | fawry
  is_active: boolean("is_active").notNull().default(false),
  test_mode: boolean("test_mode").notNull().default(true),
  label: text("label").default("\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u062F\u0641\u0639 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A"),
  api_key: text("api_key"),
  integration_id_card: text("integration_id_card"),
  iframe_id_card: text("iframe_id_card"),
  integration_id_wallet: text("integration_id_wallet"),
  iframe_id_wallet: text("iframe_id_wallet"),
  fawry_merchant_code: text("fawry_merchant_code"),
  fawry_security_key: text("fawry_security_key"),
  hmac_secret: text("hmac_secret"),
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});
var insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, created_at: true, updated_at: true });
var insertDonationSchema = createInsertSchema(donationsTable).omit({ id: true, created_at: true });
var insertSettingSchema = createInsertSchema(settingsTable);
var insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({ id: true, created_at: true });
var insertPermissionTypeSchema = createInsertSchema(permissionTypesTable).omit({ id: true, created_at: true, updated_at: true });
var insertAdminUserSchema = createInsertSchema(adminUsersTable).omit({ id: true, created_at: true, updated_at: true, password_hash: true });
var insertBannerSchema = createInsertSchema(bannersTable).omit({ id: true, created_at: true, updated_at: true });
var insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true, created_at: true, updated_at: true, password_hash: true });
var insertFieldOrderSchema = createInsertSchema(fieldOrdersTable).omit({ id: true, created_at: true, updated_at: true });

// lib/db/src/index.ts
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// artifacts/api-server/src/routes/auth.ts
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
var router2 = Router2();
async function ensureDefaults() {
  try {
    const types = await db.select().from(permissionTypesTable);
    if (types.length === 0) {
      const defaults = [
        {
          name: "\u0645\u062F\u064A\u0631 \u0643\u0627\u0645\u0644",
          description: "\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0643\u0627\u0645\u0644\u0629 \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0642\u0633\u0627\u0645",
          permissions: {
            manage_campaigns: true,
            manage_donations: true,
            manage_settings: true,
            manage_users: true,
            manage_banners: true,
            view_reports: true,
            approve_donations: true,
            delete_records: true
          },
          color: "red"
        },
        {
          name: "\u0645\u0634\u0631\u0641 \u062A\u0628\u0631\u0639\u0627\u062A",
          description: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0628\u0631\u0639\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F",
          permissions: {
            manage_campaigns: false,
            manage_donations: true,
            manage_settings: false,
            manage_users: false,
            manage_banners: false,
            view_reports: true,
            approve_donations: true,
            delete_records: false
          },
          color: "blue"
        },
        {
          name: "\u0645\u062A\u0627\u0628\u0639 \u0641\u0642\u0637",
          description: "\u0639\u0631\u0636 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0641\u0642\u0637 \u0628\u062F\u0648\u0646 \u0623\u064A \u062A\u0639\u062F\u064A\u0644",
          permissions: {
            manage_campaigns: false,
            manage_donations: false,
            manage_settings: false,
            manage_users: false,
            manage_banners: false,
            view_reports: true,
            approve_donations: false,
            delete_records: false
          },
          color: "gray"
        }
      ];
      for (const d of defaults) {
        await db.insert(permissionTypesTable).values(d).onConflictDoNothing();
      }
    }
    const admins = await db.select().from(adminUsersTable);
    if (admins.length === 0) {
      const [fullRole] = await db.select().from(permissionTypesTable).where(eq(permissionTypesTable.name, "\u0645\u062F\u064A\u0631 \u0643\u0627\u0645\u0644"));
      const hash = await bcrypt.hash("admin123", 10);
      await db.insert(adminUsersTable).values({
        username: "admin",
        password_hash: hash,
        display_name: "\u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
        permission_type_id: fullRole?.id,
        is_active: true
      }).onConflictDoNothing();
    }
  } catch {
  }
}
ensureDefaults();
router2.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "\u064A\u064F\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
    }
    const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.username, username)).limit(1);
    if (user) {
      if (!user.is_active) {
        return res.status(401).json({ message: "\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0648\u0642\u0648\u0641\u060C \u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0645\u062F\u064A\u0631" });
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ message: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
      let permissions = {};
      if (user.permission_type_id) {
        const [pt] = await db.select().from(permissionTypesTable).where(eq(permissionTypesTable.id, user.permission_type_id));
        permissions = pt?.permissions || {};
      }
      const sessionUser = {
        id: user.id,
        username: user.username,
        display_name: user.display_name || user.username,
        role: permissions.manage_users ? "admin" : "moderator",
        permissions
      };
      req.session.user = sessionUser;
      await db.update(adminUsersTable).set({ last_login: /* @__PURE__ */ new Date() }).where(eq(adminUsersTable.id, user.id));
      await new Promise(
        (resolve, reject) => req.session.save((err) => err ? reject(err) : resolve())
      );
      return res.json({ user: sessionUser });
    }
    return res.status(401).json({ message: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});
router2.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});
router2.get("/me", (req, res) => {
  const user = req.session.user;
  if (!user) return res.json({ user: null });
  res.json({ user });
});
router2.post("/change-password", async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "\u064A\u064F\u0631\u062C\u0649 \u0645\u0644\u0621 \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644" });
    if (newPassword.length < 6) return res.status(400).json({ message: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 6 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
    const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, sessionUser.id));
    if (!user) return res.status(404).json({ message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ message: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(adminUsersTable).set({ password_hash: newHash, updated_at: /* @__PURE__ */ new Date() }).where(eq(adminUsersTable.id, user.id));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var auth_default = router2;

// artifacts/api-server/src/routes/campaigns.ts
import { Router as Router3 } from "express";

// artifacts/api-server/src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
}
var supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

// artifacts/api-server/src/routes/campaigns.ts
var router3 = Router3();
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  }
  next();
}
router3.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router3.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("campaigns").select("*").eq("id", req.params.id).single();
    if (error) return res.status(404).json({ message: "\u0644\u0645 \u064A\u064F\u0639\u062B\u0631 \u0639\u0644\u0649 \u0627\u0644\u062D\u0645\u0644\u0629" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router3.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, goal_amount, image_url, category, days_left } = req.body;
    if (!title) return res.status(400).json({ message: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0645\u0637\u0644\u0648\u0628" });
    const { data, error } = await supabase.from("campaigns").insert({
      title,
      description,
      goal_amount: Number(goal_amount || 0),
      raised_amount: 0,
      image_url,
      category: category || "general",
      days_left,
      status: "active"
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router3.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from("campaigns").update({ ...req.body, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select().single();
    if (error) return res.status(404).json({ message: "\u0644\u0645 \u064A\u064F\u0639\u062B\u0631 \u0639\u0644\u0649 \u0627\u0644\u062D\u0645\u0644\u0629" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router3.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from("campaigns").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var campaigns_default = router3;

// artifacts/api-server/src/routes/donations.ts
import { Router as Router5 } from "express";

// artifacts/api-server/src/routes/notifications.ts
import { Router as Router4 } from "express";
import { eq as eq2 } from "drizzle-orm";
var router4 = Router4();
function requireAuth2(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  next();
}
async function getNotifSettings() {
  try {
    const row = await db.select().from(settingsTable).where(eq2(settingsTable.key, "notification_settings")).limit(1);
    return row[0]?.value || {};
  } catch {
    return {};
  }
}
async function saveNotifSettings(settings) {
  const existing = await db.select().from(settingsTable).where(eq2(settingsTable.key, "notification_settings")).limit(1);
  if (existing.length) {
    await db.update(settingsTable).set({ value: settings, updated_at: /* @__PURE__ */ new Date() }).where(eq2(settingsTable.key, "notification_settings"));
  } else {
    await db.insert(settingsTable).values({ key: "notification_settings", value: settings });
  }
}
router4.get("/settings", requireAuth2, async (_req, res) => {
  try {
    const s = await getNotifSettings();
    res.json({
      telegram: {
        enabled: s.telegram?.enabled || false,
        bot_token_set: !!s.telegram?.bot_token,
        chat_id: s.telegram?.chat_id || "",
        on_new_donation: s.telegram?.on_new_donation ?? true,
        on_approved: s.telegram?.on_approved ?? true,
        on_rejected: s.telegram?.on_rejected ?? false,
        on_agent_register: s.telegram?.on_agent_register ?? true,
        on_field_order: s.telegram?.on_field_order ?? true
      },
      whatsapp: {
        enabled: s.whatsapp?.enabled || false,
        provider: s.whatsapp?.provider || "whatsapp_business",
        api_url: s.whatsapp?.api_url || "",
        token_set: !!s.whatsapp?.token,
        phone_number_id: s.whatsapp?.phone_number_id || "",
        send_thank_you: s.whatsapp?.send_thank_you ?? true,
        send_confirmation: s.whatsapp?.send_confirmation ?? true,
        thank_you_template: s.whatsapp?.thank_you_template || "\u0634\u0643\u0631\u0627\u064B \u0644\u062A\u0628\u0631\u0639\u0643 \u0627\u0644\u0643\u0631\u064A\u0645 \u064A\u0627 {name}! \u062A\u0628\u0631\u0639\u0643 \u0628\u0645\u0628\u0644\u063A {amount} \u062C\u0646\u064A\u0647 \u0633\u064A\u064F\u063A\u064A\u0650\u0651\u0631 \u062D\u064A\u0627\u0629 \u0643\u062B\u064A\u0631\u064A\u0646. \u0628\u0627\u0631\u0643 \u0627\u0644\u0644\u0647 \u0641\u064A\u0643. \u0631\u0642\u0645 \u0639\u0645\u0644\u064A\u062A\u0643: {refqa_id}"
      },
      twilio: {
        enabled: s.twilio?.enabled || false,
        account_sid_set: !!s.twilio?.account_sid,
        auth_token_set: !!s.twilio?.auth_token,
        from_number: s.twilio?.from_number || "",
        from_name: s.twilio?.from_name || "\u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629",
        send_sms_on_approve: s.twilio?.send_sms_on_approve ?? true
      },
      email: {
        enabled: s.email?.enabled || false,
        smtp_host: s.email?.smtp_host || "",
        smtp_port: s.email?.smtp_port || 587,
        smtp_user: s.email?.smtp_user || "",
        smtp_pass_set: !!s.email?.smtp_pass,
        from_email: s.email?.from_email || "",
        from_name: s.email?.from_name || "\u0645\u0624\u0633\u0633\u0629 \u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629",
        send_on_approve: s.email?.send_on_approve ?? true,
        send_on_register: s.email?.send_on_register ?? true
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router4.post("/settings", requireAuth2, async (req, res) => {
  try {
    const existing = await getNotifSettings();
    const { section, ...data } = req.body;
    if (!section) return res.status(400).json({ message: "section \u0645\u0637\u0644\u0648\u0628" });
    const updated = { ...existing, [section]: { ...existing[section] || {}, ...data } };
    await saveNotifSettings(updated);
    res.json({ success: true, message: "\u062A\u0645 \u0627\u0644\u062D\u0641\u0638" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router4.post("/telegram/test", requireAuth2, async (req, res) => {
  try {
    const s = await getNotifSettings();
    const tg = s.telegram;
    if (!tg?.bot_token || !tg?.chat_id) return res.status(400).json({ message: "\u064A\u062C\u0628 \u0636\u0628\u0637 Bot Token \u0648 Chat ID \u0623\u0648\u0644\u0627\u064B" });
    const text2 = "\u{1F9EA} *\u0627\u062E\u062A\u0628\u0627\u0631 \u062A\u064A\u0644\u064A\u062C\u0631\u0627\u0645* \u2014 \u0645\u0624\u0633\u0633\u0629 \u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629\n\u2705 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u064A\u0639\u0645\u0644 \u0628\u0646\u062C\u0627\u062D!";
    const response = await fetch(`https://api.telegram.org/bot${tg.bot_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tg.chat_id, text: text2, parse_mode: "Markdown" })
    });
    const result = await response.json();
    if (!result.ok) return res.status(400).json({ message: result.description || "\u0641\u0634\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629" });
    res.json({ success: true, message: "\u2705 \u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631 \u0628\u0646\u062C\u0627\u062D" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router4.post("/telegram/set-token", requireAuth2, async (req, res) => {
  try {
    const { bot_token, chat_id } = req.body;
    const existing = await getNotifSettings();
    const updated = { ...existing, telegram: { ...existing.telegram || {}, bot_token, chat_id } };
    await saveNotifSettings(updated);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router4.post("/whatsapp/set-token", requireAuth2, async (req, res) => {
  try {
    const { token, phone_number_id, api_url } = req.body;
    const existing = await getNotifSettings();
    const updated = { ...existing, whatsapp: { ...existing.whatsapp || {}, token, phone_number_id, api_url } };
    await saveNotifSettings(updated);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router4.post("/whatsapp/test", requireAuth2, async (req, res) => {
  try {
    const s = await getNotifSettings();
    const wa = s.whatsapp;
    if (!wa?.token || !wa?.phone_number_id) return res.status(400).json({ message: "\u064A\u062C\u0628 \u0636\u0628\u0637 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0648\u0627\u062A\u0633\u0627\u0628 \u0623\u0648\u0644\u0627\u064B" });
    const { test_phone } = req.body;
    if (!test_phone) return res.status(400).json({ message: "\u0623\u062F\u062E\u0644 \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0644\u0644\u0627\u062E\u062A\u0628\u0627\u0631" });
    const url = wa.api_url || `https://graph.facebook.com/v18.0/${wa.phone_number_id}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to: test_phone.replace(/\D/g, ""),
      type: "text",
      text: { body: "\u{1F9EA} \u0627\u062E\u062A\u0628\u0627\u0631 \u0648\u0627\u062A\u0633\u0627\u0628 \u2014 \u0645\u0624\u0633\u0633\u0629 \u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629 \u2705 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u064A\u0639\u0645\u0644 \u0628\u0646\u062C\u0627\u062D!" }
    };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${wa.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (result.error) return res.status(400).json({ message: result.error.message });
    res.json({ success: true, message: "\u2705 \u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router4.post("/twilio/set-credentials", requireAuth2, async (req, res) => {
  try {
    const { account_sid, auth_token } = req.body;
    const existing = await getNotifSettings();
    const updated = { ...existing, twilio: { ...existing.twilio || {}, account_sid, auth_token } };
    await saveNotifSettings(updated);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router4.post("/twilio/test", requireAuth2, async (req, res) => {
  try {
    const s = await getNotifSettings();
    const tw = s.twilio;
    if (!tw?.account_sid || !tw?.auth_token) return res.status(400).json({ message: "\u064A\u062C\u0628 \u0636\u0628\u0637 \u0628\u064A\u0627\u0646\u0627\u062A Twilio \u0623\u0648\u0644\u0627\u064B" });
    const { test_phone } = req.body;
    if (!test_phone) return res.status(400).json({ message: "\u0623\u062F\u062E\u0644 \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0644\u0644\u0627\u062E\u062A\u0628\u0627\u0631" });
    const auth = Buffer.from(`${tw.account_sid}:${tw.auth_token}`).toString("base64");
    const body = new URLSearchParams({ To: test_phone, From: tw.from_number, Body: "\u{1F9EA} \u0627\u062E\u062A\u0628\u0627\u0631 SMS \u2014 \u0645\u0624\u0633\u0633\u0629 \u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629 \u2705" });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${tw.account_sid}/Messages.json`, {
      method: "POST",
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    const result = await response.json();
    if (result.status === "failed" || result.error_code) return res.status(400).json({ message: result.error_message || "\u0641\u0634\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644" });
    res.json({ success: true, message: "\u2705 \u062A\u0645 \u0625\u0631\u0633\u0627\u0644 SMS \u0628\u0646\u062C\u0627\u062D" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router4.post("/email/set-credentials", requireAuth2, async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name } = req.body;
    const existing = await getNotifSettings();
    const updated = { ...existing, email: { ...existing.email || {}, smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name } };
    await saveNotifSettings(updated);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router4.post("/email/test", requireAuth2, async (req, res) => {
  try {
    const s = await getNotifSettings();
    const em = s.email;
    if (!em?.smtp_host || !em?.smtp_user || !em?.smtp_pass) return res.status(400).json({ message: "\u064A\u062C\u0628 \u0636\u0628\u0637 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0628\u0631\u064A\u062F \u0623\u0648\u0644\u0627\u064B" });
    const { test_email } = req.body;
    if (!test_email) return res.status(400).json({ message: "\u0623\u062F\u062E\u0644 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0644\u0644\u0627\u062E\u062A\u0628\u0627\u0631" });
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: em.smtp_host,
        port: em.smtp_port || 587,
        secure: (em.smtp_port || 587) === 465,
        auth: { user: em.smtp_user, pass: em.smtp_pass }
      });
      await transporter.sendMail({
        from: `"${em.from_name || "\u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629"}" <${em.from_email || em.smtp_user}>`,
        to: test_email,
        subject: "\u{1F9EA} \u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0628\u0631\u064A\u062F \u2014 \u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629",
        html: `<div dir="rtl" style="font-family:Arial;padding:20px"><h2>\u2705 \u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u064A\u0639\u0645\u0644 \u0628\u0646\u062C\u0627\u062D!</h2><p>\u0647\u0630\u0647 \u0631\u0633\u0627\u0644\u0629 \u0627\u062E\u062A\u0628\u0627\u0631 \u0645\u0646 \u0645\u0646\u0638\u0648\u0645\u0629 \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0645\u0624\u0633\u0633\u0629 \u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629.</p></div>`
      });
      res.json({ success: true, message: "\u2705 \u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0628\u0646\u062C\u0627\u062D" });
    } catch (mailErr) {
      res.status(400).json({ message: `\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0625\u0631\u0633\u0627\u0644: ${mailErr.message}` });
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
async function sendTelegramNotif(text2) {
  try {
    const row = await db.select().from(settingsTable).where(eq2(settingsTable.key, "notification_settings")).limit(1);
    const s = row[0]?.value || {};
    const tg = s.telegram;
    if (!tg?.enabled || !tg?.bot_token || !tg?.chat_id) return;
    await fetch(`https://api.telegram.org/bot${tg.bot_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tg.chat_id, text: text2, parse_mode: "Markdown" })
    });
  } catch {
  }
}
async function sendWhatsAppNotif(phone, message) {
  try {
    const row = await db.select().from(settingsTable).where(eq2(settingsTable.key, "notification_settings")).limit(1);
    const s = row[0]?.value || {};
    const wa = s.whatsapp;
    if (!wa?.enabled || !wa?.token || !wa?.phone_number_id) return;
    const url = wa.api_url || `https://graph.facebook.com/v18.0/${wa.phone_number_id}/messages`;
    await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${wa.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: phone.replace(/\D/g, ""), type: "text", text: { body: message } })
    });
  } catch {
  }
}
async function sendEmailNotif(to, subject, html) {
  try {
    const row = await db.select().from(settingsTable).where(eq2(settingsTable.key, "notification_settings")).limit(1);
    const s = row[0]?.value || {};
    const em = s.email;
    if (!em?.enabled || !em?.smtp_host || !em?.smtp_pass) return;
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: em.smtp_host,
      port: em.smtp_port || 587,
      secure: (em.smtp_port || 587) === 465,
      auth: { user: em.smtp_user, pass: em.smtp_pass }
    });
    await transporter.sendMail({ from: `"${em.from_name || "\u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629"}" <${em.from_email || em.smtp_user}>`, to, subject, html });
  } catch {
  }
}
var notifications_default = router4;

// artifacts/api-server/src/routes/donations.ts
var router5 = Router5();
function requireAuth3(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  }
  next();
}
router5.get("/", async (req, res) => {
  try {
    const { status, _limit, date_from, date_to } = req.query;
    let query = supabase.from("donations").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (_limit) query = query.limit(Number(_limit));
    if (date_from) query = query.gte("created_at", date_from);
    if (date_to) query = query.lte("created_at", date_to + "T23:59:59");
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router5.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("donations").select("*").eq("id", req.params.id).single();
    if (error) return res.status(404).json({ message: "\u0644\u0645 \u064A\u064F\u0639\u062B\u0631 \u0639\u0644\u0649 \u0627\u0644\u062A\u0628\u0631\u0639" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router5.post("/", async (req, res) => {
  try {
    const {
      donor_name,
      donor_phone,
      donor_email,
      campaign_id,
      campaign_title,
      amount,
      payment_method,
      operation_id,
      receipt_image_url,
      user_id,
      note
    } = req.body;
    if (!donor_name || !donor_phone || !amount || !operation_id) {
      return res.status(400).json({ message: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0628\u0631\u0639 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629" });
    }
    const { data, error } = await supabase.from("donations").insert({
      donor_name,
      donor_phone,
      donor_email,
      campaign_id,
      campaign_title,
      amount: Number(amount),
      payment_method: payment_method || "bank_transfer",
      operation_id,
      receipt_image_url,
      user_id,
      note,
      status: "pending"
    }).select().single();
    if (error) throw error;
    sendTelegramNotif(
      `\u{1F4B0} *\u062A\u0628\u0631\u0639 \u062C\u062F\u064A\u062F*
\u{1F464} *\u0627\u0644\u0645\u062A\u0628\u0631\u0639:* ${donor_name}
\u{1F4F1} *\u0627\u0644\u0647\u0627\u062A\u0641:* ${donor_phone}
\u{1F4B5} *\u0627\u0644\u0645\u0628\u0644\u063A:* ${Number(amount).toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647
\u{1F3F7} *\u0627\u0644\u062D\u0645\u0644\u0629:* ${campaign_title || "\u0639\u0627\u0645"}
\u{1F4B3} *\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639:* ${payment_method || "\u062A\u062D\u0648\u064A\u0644 \u0628\u0646\u0643\u064A"}
\u{1F516} *\u0631\u0642\u0645 \u0627\u0644\u0639\u0645\u0644\u064A\u0629:* ${operation_id}
\u23F3 *\u0627\u0644\u062D\u0627\u0644\u0629:* \u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629`
    ).catch(() => {
    });
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router5.patch("/:id/status", requireAuth3, async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "\u062D\u0627\u0644\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
    }
    const { data: current } = await supabase.from("donations").select("*").eq("id", req.params.id).single();
    if (!current) return res.status(404).json({ message: "\u0644\u0645 \u064A\u064F\u0639\u062B\u0631 \u0639\u0644\u0649 \u0627\u0644\u062A\u0628\u0631\u0639" });
    const updatePayload = { status };
    if (notes) updatePayload.notes = notes;
    if (status === "approved") updatePayload.confirmed_at = (/* @__PURE__ */ new Date()).toISOString();
    const { data, error } = await supabase.from("donations").update(updatePayload).eq("id", req.params.id).select().single();
    if (error) return res.status(404).json({ message: "\u0644\u0645 \u064A\u064F\u0639\u062B\u0631 \u0639\u0644\u0649 \u0627\u0644\u062A\u0628\u0631\u0639" });
    if (status === "approved" && current.status !== "approved" && data.campaign_id) {
      try {
        const { data: camp } = await supabase.from("campaigns").select("raised_amount").eq("id", data.campaign_id).single();
        if (camp) {
          await supabase.from("campaigns").update({ raised_amount: Number(camp.raised_amount) + Number(data.amount), updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", data.campaign_id);
        }
      } catch {
      }
    }
    if (status !== "approved" && current.status === "approved" && data.campaign_id) {
      try {
        const { data: camp } = await supabase.from("campaigns").select("raised_amount").eq("id", data.campaign_id).single();
        if (camp) {
          await supabase.from("campaigns").update({ raised_amount: Math.max(0, Number(camp.raised_amount) - Number(data.amount)) }).eq("id", data.campaign_id);
        }
      } catch {
      }
    }
    if (status === "approved" && current.status !== "approved") {
      sendTelegramNotif(
        `\u2705 *\u062A\u0645 \u0627\u0639\u062A\u0645\u0627\u062F \u062A\u0628\u0631\u0639*
\u{1F464} *\u0627\u0644\u0645\u062A\u0628\u0631\u0639:* ${data.donor_name}
\u{1F4B5} *\u0627\u0644\u0645\u0628\u0644\u063A:* ${Number(data.amount).toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647
\u{1F3F7} *\u0627\u0644\u062D\u0645\u0644\u0629:* ${data.campaign_title || "\u0639\u0627\u0645"}
\u{1F516} *\u0631\u0642\u0645 Refqa:* ${data.refqa_id || data.operation_id}
` + (notes ? `\u{1F4DD} *\u0645\u0644\u0627\u062D\u0638\u0629:* ${notes}` : "")
      ).catch(() => {
      });
      if (data.donor_phone) {
        const thankYou = `\u0634\u0643\u0631\u0627\u064B \u0644\u062A\u0628\u0631\u0639\u0643 \u0627\u0644\u0643\u0631\u064A\u0645 \u064A\u0627 ${data.donor_name}! \u062A\u0628\u0631\u0639\u0643 \u0628\u0645\u0628\u0644\u063A ${Number(data.amount).toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647 \u0633\u064A\u064F\u063A\u064A\u0650\u0651\u0631 \u062D\u064A\u0627\u0629 \u0643\u062B\u064A\u0631\u064A\u0646. \u0628\u0627\u0631\u0643 \u0627\u0644\u0644\u0647 \u0641\u064A\u0643. \u0631\u0642\u0645 \u0639\u0645\u0644\u064A\u062A\u0643: ${data.refqa_id || data.operation_id}`;
        sendWhatsAppNotif(data.donor_phone, thankYou).catch(() => {
        });
      }
      if (data.donor_email) {
        sendEmailNotif(
          data.donor_email,
          `\u2705 \u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u062A\u0628\u0631\u0639\u0643 \u2014 \u0645\u0624\u0633\u0633\u0629 \u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629`,
          `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#2563eb">\u0628\u0627\u0631\u0643 \u0627\u0644\u0644\u0647 \u0641\u064A\u0643 \u064A\u0627 ${data.donor_name}!</h2>
            <p>\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u062A\u0628\u0631\u0639\u0643 \u0648\u0627\u0639\u062A\u0645\u0627\u062F\u0647 \u0628\u0646\u062C\u0627\u062D.</p>
            <div style="background:#f3f4f6;border-radius:12px;padding:16px;margin:16px 0">
              <p style="margin:4px 0"><strong>\u0627\u0644\u0645\u0628\u0644\u063A:</strong> ${Number(data.amount).toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647</p>
              <p style="margin:4px 0"><strong>\u0627\u0644\u062D\u0645\u0644\u0629:</strong> ${data.campaign_title || "\u062A\u0628\u0631\u0639 \u0639\u0627\u0645"}</p>
              <p style="margin:4px 0"><strong>\u0631\u0642\u0645 \u0627\u0644\u0639\u0645\u0644\u064A\u0629:</strong> ${data.refqa_id || data.operation_id}</p>
              <p style="margin:4px 0"><strong>\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u062A\u0623\u0643\u064A\u062F:</strong> ${(/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <p>\u062C\u0632\u0627\u0643 \u0627\u0644\u0644\u0647 \u062E\u064A\u0631\u0627\u064B \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0637\u064A\u0628. \u062A\u0628\u0631\u0639\u0643 \u0633\u064A\u0635\u0646\u0639 \u0641\u0631\u0642\u0627\u064B \u0641\u064A \u062D\u064A\u0627\u0629 \u0643\u062B\u064A\u0631\u064A\u0646.</p>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">\u0645\u0624\u0633\u0633\u0629 \u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629 \u2014 \u0645\u0631\u062E\u0635\u0629 \u0645\u0646 \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u062A\u0636\u0627\u0645\u0646 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A \u0631\u0642\u0645 7932</p>
          </div>`
        ).catch(() => {
        });
      }
    }
    if (status === "rejected" && current.status !== "rejected") {
      sendTelegramNotif(
        `\u274C *\u062A\u0645 \u0631\u0641\u0636 \u062A\u0628\u0631\u0639*
\u{1F464} *\u0627\u0644\u0645\u062A\u0628\u0631\u0639:* ${data.donor_name}
\u{1F4B5} *\u0627\u0644\u0645\u0628\u0644\u063A:* ${Number(data.amount).toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647
\u{1F516} *\u0631\u0642\u0645:* ${data.refqa_id || data.operation_id}
` + (notes ? `\u{1F4DD} *\u0627\u0644\u0633\u0628\u0628:* ${notes}` : "")
      ).catch(() => {
      });
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router5.get("/track", async (req, res) => {
  try {
    const { phone, refqa_id } = req.query;
    if (!phone) return res.status(400).json({ message: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0645\u0637\u0644\u0648\u0628" });
    let query = supabase.from("donations").select("id, refqa_id, operation_id, donor_name, donor_phone, amount, campaign_title, payment_method, status, created_at, confirmed_at, notes").eq("donor_phone", phone.trim()).order("created_at", { ascending: false });
    if (refqa_id) {
      query = query.or(`refqa_id.eq.${refqa_id},operation_id.eq.${refqa_id}`);
    }
    const { data, error } = await query.limit(20);
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router5.delete("/:id", requireAuth3, async (req, res) => {
  try {
    const { data: current } = await supabase.from("donations").select("*").eq("id", req.params.id).single();
    if (!current) return res.status(404).json({ message: "\u0644\u0645 \u064A\u064F\u0639\u062B\u0631 \u0639\u0644\u0649 \u0627\u0644\u062A\u0628\u0631\u0639" });
    if (current.status === "approved" && current.campaign_id) {
      try {
        const { data: camp } = await supabase.from("campaigns").select("raised_amount").eq("id", current.campaign_id).single();
        if (camp) {
          await supabase.from("campaigns").update({ raised_amount: Math.max(0, Number(camp.raised_amount) - Number(current.amount)) }).eq("id", current.campaign_id);
        }
      } catch {
      }
    }
    const { error } = await supabase.from("donations").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062A\u0628\u0631\u0639 \u0628\u0646\u062C\u0627\u062D" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router5.patch("/:id", requireAuth3, async (req, res) => {
  try {
    const { status, ...rest } = req.body;
    const { data: current } = await supabase.from("donations").select("*").eq("id", req.params.id).single();
    const { data, error } = await supabase.from("donations").update({ status, ...rest }).eq("id", req.params.id).select().single();
    if (error) return res.status(404).json({ message: "\u0644\u0645 \u064A\u064F\u0639\u062B\u0631 \u0639\u0644\u0649 \u0627\u0644\u062A\u0628\u0631\u0639" });
    if (status === "approved" && current?.status !== "approved" && data.campaign_id) {
      try {
        const { data: camp } = await supabase.from("campaigns").select("raised_amount").eq("id", data.campaign_id).single();
        if (camp) {
          await supabase.from("campaigns").update({ raised_amount: Number(camp.raised_amount) + Number(data.amount), updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", data.campaign_id);
        }
      } catch {
      }
      sendTelegramNotif(`\u2705 *\u062A\u0645 \u0627\u0639\u062A\u0645\u0627\u062F \u062A\u0628\u0631\u0639*
\u{1F464} ${data.donor_name} | \u{1F4B5} ${Number(data.amount).toLocaleString("ar-EG")} \u062C | \u{1F516} ${data.refqa_id || data.operation_id}`).catch(() => {
      });
      if (data.donor_phone) {
        sendWhatsAppNotif(data.donor_phone, `\u0634\u0643\u0631\u0627\u064B \u0644\u062A\u0628\u0631\u0639\u0643 \u0627\u0644\u0643\u0631\u064A\u0645 \u064A\u0627 ${data.donor_name}! \u0645\u0628\u0644\u063A ${Number(data.amount).toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647. \u0631\u0642\u0645 \u0639\u0645\u0644\u064A\u062A\u0643: ${data.refqa_id || data.operation_id}`).catch(() => {
        });
      }
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var donations_default = router5;

// artifacts/api-server/src/routes/settings.ts
import { Router as Router6 } from "express";
var router6 = Router6();
function requireAuth4(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  }
  next();
}
router6.get("/:key", async (req, res) => {
  try {
    const { data, error } = await supabase.from("settings").select("value").eq("key", req.params.key).single();
    if (error || !data) return res.json({ value: null });
    res.json({ value: data.value });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router6.put("/:key", requireAuth4, async (req, res) => {
  try {
    const { value } = req.body;
    const { error } = await supabase.from("settings").upsert(
      { key: req.params.key, value, updated_at: (/* @__PURE__ */ new Date()).toISOString() },
      { onConflict: "key" }
    );
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var settings_default = router6;

// artifacts/api-server/src/routes/audit-logs.ts
import { Router as Router7 } from "express";
var router7 = Router7();
router7.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router7.post("/", async (req, res) => {
  try {
    const { action, table_name, record_id } = req.body;
    if (!action) return res.status(400).json({ message: "action \u0645\u0637\u0644\u0648\u0628" });
    const { data, error } = await supabase.from("audit_logs").insert({ action, table_name, record_id }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var audit_logs_default = router7;

// artifacts/api-server/src/routes/upload.ts
import { Router as Router8 } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var uploadsDir = path.join(__dirname, "..", "..", "uploads", "receipts");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
var storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `receipt_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});
var upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("\u0646\u0648\u0639 \u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645"));
  }
});
var router8 = Router8();
router8.post("/receipt", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "\u0644\u0645 \u064A\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641" });
  const url = `/api/uploads/receipts/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});
var upload_default = router8;

// artifacts/api-server/src/routes/stats.ts
import { Router as Router9 } from "express";
var router9 = Router9();
router9.get("/", async (_req, res) => {
  try {
    const [{ data: donations }, { data: campaigns }] = await Promise.all([
      supabase.from("donations").select("amount, status, donor_phone"),
      supabase.from("campaigns").select("id")
    ]);
    const allDonations = donations || [];
    const approved = allDonations.filter((d) => d.status === "approved");
    const totalRaised = approved.reduce((s, d) => s + Number(d.amount), 0);
    const uniquePhones = new Set(allDonations.map((d) => d.donor_phone)).size;
    res.json({
      donors: uniquePhones,
      totalRaised,
      campaigns: (campaigns || []).length,
      beneficiaries: Math.floor(totalRaised / 150)
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var stats_default = router9;

// artifacts/api-server/src/routes/admin-users.ts
import { Router as Router10 } from "express";
import { eq as eq3, desc } from "drizzle-orm";
import bcrypt2 from "bcryptjs";
var router10 = Router10();
function requireAuth5(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  next();
}
router10.get("/", requireAuth5, async (_req, res) => {
  try {
    const users = await db.select({
      id: adminUsersTable.id,
      username: adminUsersTable.username,
      display_name: adminUsersTable.display_name,
      permission_type_id: adminUsersTable.permission_type_id,
      is_active: adminUsersTable.is_active,
      last_login: adminUsersTable.last_login,
      created_at: adminUsersTable.created_at
    }).from(adminUsersTable).orderBy(desc(adminUsersTable.created_at));
    const permTypes = await db.select().from(permissionTypesTable);
    const result = users.map((u) => ({
      ...u,
      permission_type: permTypes.find((p) => p.id === u.permission_type_id) || null
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router10.post("/", requireAuth5, async (req, res) => {
  try {
    const { username, password, display_name, permission_type_id } = req.body;
    if (!username || !password) return res.status(400).json({ message: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    if (password.length < 6) return res.status(400).json({ message: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 6 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
    const hash = await bcrypt2.hash(password, 10);
    const rows = await db.insert(adminUsersTable).values({ username, password_hash: hash, display_name, permission_type_id, is_active: true }).returning();
    const { password_hash: _, ...user } = rows[0];
    res.status(201).json(user);
  } catch (e) {
    if (e.message?.includes("unique")) return res.status(400).json({ message: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644" });
    res.status(500).json({ message: e.message });
  }
});
router10.patch("/:id", requireAuth5, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updates = { ...rest, updated_at: /* @__PURE__ */ new Date() };
    if (password) {
      if (password.length < 6) return res.status(400).json({ message: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 6 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
      updates.password_hash = await bcrypt2.hash(password, 10);
    }
    const rows = await db.update(adminUsersTable).set(updates).where(eq3(adminUsersTable.id, req.params.id)).returning();
    if (!rows.length) return res.status(404).json({ message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    const { password_hash: _, ...user } = rows[0];
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router10.delete("/:id", requireAuth5, async (req, res) => {
  try {
    await db.delete(adminUsersTable).where(eq3(adminUsersTable.id, req.params.id));
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var admin_users_default = router10;

// artifacts/api-server/src/routes/permission-types.ts
import { Router as Router11 } from "express";
import { eq as eq4, desc as desc2 } from "drizzle-orm";
var router11 = Router11();
function requireAuth6(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  next();
}
router11.get("/", requireAuth6, async (_req, res) => {
  try {
    const rows = await db.select().from(permissionTypesTable).orderBy(desc2(permissionTypesTable.created_at));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router11.post("/", requireAuth6, async (req, res) => {
  try {
    const { name, description, permissions, color } = req.body;
    if (!name) return res.status(400).json({ message: "\u0627\u0633\u0645 \u0646\u0648\u0639 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0637\u0644\u0648\u0628" });
    const rows = await db.insert(permissionTypesTable).values({ name, description, permissions: permissions || {}, color: color || "blue" }).returning();
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.message?.includes("unique")) return res.status(400).json({ message: "\u0627\u0633\u0645 \u0646\u0648\u0639 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644" });
    res.status(500).json({ message: e.message });
  }
});
router11.patch("/:id", requireAuth6, async (req, res) => {
  try {
    const rows = await db.update(permissionTypesTable).set({ ...req.body, updated_at: /* @__PURE__ */ new Date() }).where(eq4(permissionTypesTable.id, req.params.id)).returning();
    if (!rows.length) return res.status(404).json({ message: "\u0646\u0648\u0639 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router11.delete("/:id", requireAuth6, async (req, res) => {
  try {
    await db.delete(permissionTypesTable).where(eq4(permissionTypesTable.id, req.params.id));
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var permission_types_default = router11;

// artifacts/api-server/src/routes/banners.ts
import { Router as Router12 } from "express";
import { eq as eq5, asc } from "drizzle-orm";
var router12 = Router12();
function requireAuth7(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  next();
}
router12.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(bannersTable).orderBy(asc(bannersTable.display_order));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router12.post("/", requireAuth7, async (req, res) => {
  try {
    const { title, subtitle, badge_text, image_url, link_url, link_text, bg_color, display_order } = req.body;
    if (!title) return res.status(400).json({ message: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0645\u0637\u0644\u0648\u0628" });
    const rows = await db.insert(bannersTable).values({ title, subtitle, badge_text, image_url, link_url, link_text, bg_color: bg_color || "primary", display_order: display_order || 0, is_active: true }).returning();
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router12.patch("/:id", requireAuth7, async (req, res) => {
  try {
    const rows = await db.update(bannersTable).set({ ...req.body, updated_at: /* @__PURE__ */ new Date() }).where(eq5(bannersTable.id, req.params.id)).returning();
    if (!rows.length) return res.status(404).json({ message: "\u0627\u0644\u0628\u0627\u0646\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router12.delete("/:id", requireAuth7, async (req, res) => {
  try {
    await db.delete(bannersTable).where(eq5(bannersTable.id, req.params.id));
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var banners_default = router12;

// artifacts/api-server/src/routes/payments.ts
import { Router as Router13 } from "express";
import crypto from "crypto";
var router13 = Router13();
var PAYMOB_BASE = "https://accept.paymob.com/api";
async function getSettings() {
  const rows = await db.select().from(paymentSettingsTable).limit(1);
  return rows[0] ?? null;
}
async function generateRefqaId() {
  const today = /* @__PURE__ */ new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `Refqa-${dateStr}-`;
  const { count } = await supabase.from("donations").select("*", { count: "exact", head: true }).like("refqa_id", `${prefix}%`);
  const seq = ((count ?? 0) + 1).toString().padStart(4, "0");
  return `${prefix}${seq}`;
}
async function getPaymobToken(apiKey) {
  const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey })
  });
  if (!res.ok) throw new Error("\u0641\u0634\u0644 \u0627\u0644\u062A\u0648\u062B\u064A\u0642 \u0645\u0639 Paymob");
  const data = await res.json();
  return data.token;
}
function verifyPaymobHmac(data, secret) {
  try {
    const fields = [
      data.amount_cents,
      data.created_at,
      data.currency,
      data.error_occured,
      data.has_parent_transaction,
      data.id,
      data.integration_id,
      data.is_3d_secure,
      data.is_auth,
      data.is_capture,
      data.is_refunded,
      data.is_standalone_payment,
      data.is_voided,
      data.order?.id,
      data.owner,
      data.pending,
      data.source_data?.pan,
      data.source_data?.sub_type,
      data.source_data?.type,
      data.success
    ];
    const str = fields.join("").replace(/undefined/g, "");
    const hmac = crypto.createHmac("sha512", secret).update(str).digest("hex");
    return hmac === data.hmac;
  } catch {
    return false;
  }
}
router13.post("/initiate", async (req, res) => {
  try {
    const {
      amount,
      donor_name,
      donor_phone,
      donor_email,
      campaign_id,
      campaign_title,
      integration_type = "card"
    } = req.body;
    if (!amount || !donor_name || !donor_phone) {
      return res.status(400).json({ message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629: \u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0627\u0644\u0645\u0628\u0644\u063A \u0645\u0637\u0644\u0648\u0628\u0629" });
    }
    const settings = await getSettings();
    const refqaId = await generateRefqaId();
    const isDemoMode = !settings || !settings.is_active || !settings.api_key || settings.test_mode;
    if (isDemoMode) {
      const { data: donation } = await supabase.from("donations").insert({
        donor_name,
        donor_phone,
        donor_email: donor_email || null,
        campaign_id: campaign_id || null,
        campaign_title: campaign_title || null,
        amount: Number(amount),
        payment_method: "online_demo",
        operation_id: refqaId,
        refqa_id: refqaId,
        status: "pending"
      }).select().single();
      return res.json({
        demo_mode: true,
        refqa_id: refqaId,
        donation_id: donation?.id,
        payment_url: null,
        message: "\u0648\u0636\u0639 \u062A\u062C\u0631\u064A\u0628\u064A \u2014 \u0644\u0627 \u062A\u062A\u0645 \u0645\u0639\u0627\u0645\u0644\u0627\u062A \u062D\u0642\u064A\u0642\u064A\u0629"
      });
    }
    if (settings.provider === "paymob") {
      const integrationId = integration_type === "wallet" ? settings.integration_id_wallet : settings.integration_id_card;
      const iframeId = integration_type === "wallet" ? settings.iframe_id_wallet : settings.iframe_id_card;
      if (!integrationId || !iframeId) {
        return res.status(503).json({
          message: `\u0625\u0639\u062F\u0627\u062F ${integration_type === "wallet" ? "\u0627\u0644\u0645\u062D\u0641\u0638\u0629" : "\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u062F\u0641\u0639"} \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644 \u2014 \u062A\u062D\u0642\u0642 \u0645\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u062F\u0641\u0639`,
          not_configured: true
        });
      }
      const amountCents = Math.round(Number(amount) * 100);
      const token = await getPaymobToken(settings.api_key);
      const orderRes = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          delivery_needed: false,
          amount_cents: amountCents,
          currency: "EGP",
          merchant_order_id: refqaId,
          items: campaign_title ? [{
            name: campaign_title,
            amount_cents: amountCents,
            description: `\u062A\u0628\u0631\u0639 \u2014 ${campaign_title}`,
            quantity: 1
          }] : []
        })
      });
      if (!orderRes.ok) throw new Error("\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0637\u0644\u0628 \u0641\u064A Paymob");
      const order = await orderRes.json();
      const nameParts = donor_name.trim().split(" ");
      const payKeyRes = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          amount_cents: amountCents,
          expiration: 3600,
          order_id: order.id,
          billing_data: {
            first_name: nameParts[0] || donor_name,
            last_name: nameParts.slice(1).join(" ") || ".",
            phone_number: donor_phone,
            email: donor_email || "noreply@rafaqaa.org",
            country: "EG",
            city: "Cairo",
            street: "N/A",
            building: "N/A",
            floor: "N/A",
            apartment: "N/A"
          },
          currency: "EGP",
          integration_id: Number(integrationId),
          lock_order_when_paid: false
        })
      });
      if (!payKeyRes.ok) throw new Error("\u0641\u0634\u0644 \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0645\u0641\u062A\u0627\u062D \u0627\u0644\u062F\u0641\u0639");
      const payKeyData = await payKeyRes.json();
      const { data: donation } = await supabase.from("donations").insert({
        donor_name,
        donor_phone,
        donor_email: donor_email || null,
        campaign_id: campaign_id || null,
        campaign_title: campaign_title || null,
        amount: Number(amount),
        payment_method: `online_${integration_type}`,
        operation_id: refqaId,
        refqa_id: refqaId,
        status: "pending",
        paymob_order_id: String(order.id)
      }).select().single();
      return res.json({
        demo_mode: false,
        refqa_id: refqaId,
        donation_id: donation?.id,
        payment_url: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${payKeyData.token}`,
        order_id: order.id
      });
    }
    return res.status(503).json({
      message: "\u0645\u0632\u0648\u062F \u0627\u0644\u062F\u0641\u0639 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645. \u064A\u0631\u062C\u0649 \u0625\u0639\u062F\u0627\u062F \u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u062F\u0641\u0639 \u0645\u0646 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645.",
      not_configured: true
    });
  } catch (e) {
    console.error("Payment initiate error:", e);
    res.status(500).json({ message: e.message });
  }
});
router13.get("/status/:refqaId", async (req, res) => {
  try {
    const { refqaId } = req.params;
    const { data, error } = await supabase.from("donations").select("id, refqa_id, status, amount, donor_name, campaign_title, confirmed_at, created_at").eq("refqa_id", refqaId).single();
    if (error || !data) return res.status(404).json({ message: "\u0645\u0639\u0627\u0645\u0644\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router13.post("/demo/confirm/:refqaId", async (req, res) => {
  try {
    const { refqaId } = req.params;
    const { data, error } = await supabase.from("donations").select("*").eq("refqa_id", refqaId).single();
    if (error || !data) return res.status(404).json({ message: "\u0645\u0639\u0627\u0645\u0644\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
    if (data.status === "approved") return res.json({ success: true, already_confirmed: true });
    await supabase.from("donations").update({
      status: "approved",
      confirmed_at: (/* @__PURE__ */ new Date()).toISOString(),
      gateway_transaction_id: `DEMO-${Date.now()}`
    }).eq("refqa_id", refqaId);
    if (data.campaign_id) {
      const { data: camp } = await supabase.from("campaigns").select("raised_amount").eq("id", data.campaign_id).single();
      if (camp) {
        await supabase.from("campaigns").update({ raised_amount: Number(camp.raised_amount) + Number(data.amount) }).eq("id", data.campaign_id);
      }
    }
    sendTelegramNotif(
      `\u2705 *\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u062F\u0641\u0639 \u062A\u062C\u0631\u064A\u0628\u064A*
\u{1F464} *\u0627\u0644\u0645\u062A\u0628\u0631\u0639:* ${data.donor_name}
\u{1F4B5} *\u0627\u0644\u0645\u0628\u0644\u063A:* ${Number(data.amount).toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647
\u{1F516} *\u0631\u0642\u0645 Refqa:* ${refqaId}`
    ).catch(() => {
    });
    if (data.donor_phone) {
      sendWhatsAppNotif(
        data.donor_phone,
        `\u0634\u0643\u0631\u0627\u064B \u0644\u062A\u0628\u0631\u0639\u0643 \u0627\u0644\u0643\u0631\u064A\u0645 \u064A\u0627 ${data.donor_name}! \u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u062A\u0628\u0631\u0639\u0643 \u0628\u0645\u0628\u0644\u063A ${Number(data.amount).toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647. \u0631\u0642\u0645 \u0639\u0645\u0644\u064A\u062A\u0643: ${refqaId}`
      ).catch(() => {
      });
    }
    res.json({ success: true, refqa_id: refqaId, message: "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062F\u0641\u0639 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router13.post("/paymob/callback", async (req, res) => {
  try {
    const { obj, hmac } = req.body;
    if (!obj) return res.status(200).json({ ok: true });
    const settings = await getSettings();
    if (settings?.hmac_secret && hmac) {
      const valid = verifyPaymobHmac({ ...obj, hmac }, settings.hmac_secret);
      if (!valid) {
        console.warn("\u26A0\uFE0F Invalid Paymob HMAC signature");
        return res.status(200).json({ ok: true });
      }
    }
    const paymobOrderId = String(obj.order?.id || "");
    const success = obj.success === true;
    const transactionId = String(obj.id || "");
    if (!paymobOrderId) return res.status(200).json({ ok: true });
    if (success) {
      const { data: donation } = await supabase.from("donations").select("*").eq("paymob_order_id", paymobOrderId).single();
      if (donation && donation.status !== "approved") {
        await supabase.from("donations").update({
          status: "approved",
          confirmed_at: (/* @__PURE__ */ new Date()).toISOString(),
          gateway_transaction_id: transactionId
        }).eq("paymob_order_id", paymobOrderId);
        if (donation.campaign_id) {
          const { data: camp } = await supabase.from("campaigns").select("raised_amount").eq("id", donation.campaign_id).single();
          if (camp) {
            await supabase.from("campaigns").update({ raised_amount: Number(camp.raised_amount) + Number(donation.amount) }).eq("id", donation.campaign_id);
          }
        }
        sendTelegramNotif(
          `\u2705 *\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u062F\u0641\u0639 Paymob*
\u{1F464} *\u0627\u0644\u0645\u062A\u0628\u0631\u0639:* ${donation.donor_name}
\u{1F4B5} *\u0627\u0644\u0645\u0628\u0644\u063A:* ${Number(donation.amount).toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647
\u{1F3F7} *\u0627\u0644\u062D\u0645\u0644\u0629:* ${donation.campaign_title || "\u0639\u0627\u0645"}
\u{1F516} *Refqa:* ${donation.refqa_id}
\u{1F510} *\u0631\u0642\u0645 \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0629:* ${transactionId}`
        ).catch(() => {
        });
        if (donation.donor_phone) {
          const thankMsg = `\u{1F31F} \u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645 \u064A\u0627 ${donation.donor_name}\u060C

\u2705 \u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u062A\u0628\u0631\u0639\u0643 \u0648\u062A\u0623\u0643\u064A\u062F\u0647 \u0628\u0646\u062C\u0627\u062D!

\u{1F4B0} \u0627\u0644\u0645\u0628\u0644\u063A: ${Number(donation.amount).toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647
\u{1F4CB} \u0627\u0644\u062D\u0645\u0644\u0629: ${donation.campaign_title || "\u062A\u0628\u0631\u0639 \u0639\u0627\u0645"}
\u{1F516} \u0631\u0642\u0645 \u0627\u0644\u062A\u0628\u0631\u0639: ${donation.refqa_id}

\u062C\u0632\u0627\u0643 \u0627\u0644\u0644\u0647 \u062E\u064A\u0631\u0627\u064B \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0637\u064A\u0628\u060C \u062A\u0628\u0631\u0639\u0643 \u0633\u064A\u0635\u0646\u0639 \u0641\u0631\u0642\u0627\u064B \u0641\u064A \u062D\u064A\u0627\u0629 \u0643\u062B\u064A\u0631\u064A\u0646 \u{1F90D}

\u2014 \u0645\u0624\u0633\u0633\u0629 \u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629`;
          sendWhatsAppNotif(donation.donor_phone, thankMsg).catch(() => {
          });
        }
      }
    } else {
      await supabase.from("donations").update({ status: "rejected" }).eq("paymob_order_id", paymobOrderId).neq("status", "approved");
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Paymob callback error:", e);
    res.status(200).json({ ok: true });
  }
});
var payments_default = router13;

// artifacts/api-server/src/routes/payment-settings.ts
import { Router as Router14 } from "express";
import { eq as eq6 } from "drizzle-orm";
var router14 = Router14();
function requireAuth8(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  next();
}
router14.get("/", requireAuth8, async (_req, res) => {
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
      api_key_masked: s.api_key ? s.api_key.substring(0, 8) + "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : null,
      created_at: s.created_at,
      updated_at: s.updated_at
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router14.get("/status", async (_req, res) => {
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
      is_active: s.is_active
    });
  } catch (e) {
    res.status(500).json({ configured: false, provider: "demo", test_mode: true });
  }
});
router14.post("/", requireAuth8, async (req, res) => {
  try {
    const {
      provider,
      is_active,
      test_mode,
      label,
      notes,
      api_key,
      integration_id_card,
      iframe_id_card,
      integration_id_wallet,
      iframe_id_wallet,
      fawry_merchant_code,
      fawry_security_key,
      hmac_secret
    } = req.body;
    const existing = await db.select().from(paymentSettingsTable).limit(1);
    const payload = {
      provider: provider || "demo",
      is_active: is_active ?? false,
      test_mode: test_mode ?? true,
      label: label || "\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u062F\u0641\u0639 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
      notes: notes || null,
      updated_at: /* @__PURE__ */ new Date()
    };
    if (api_key !== void 0 && api_key !== "") payload.api_key = api_key;
    if (integration_id_card !== void 0) payload.integration_id_card = integration_id_card || null;
    if (iframe_id_card !== void 0) payload.iframe_id_card = iframe_id_card || null;
    if (integration_id_wallet !== void 0) payload.integration_id_wallet = integration_id_wallet || null;
    if (iframe_id_wallet !== void 0) payload.iframe_id_wallet = iframe_id_wallet || null;
    if (fawry_merchant_code !== void 0) payload.fawry_merchant_code = fawry_merchant_code || null;
    if (fawry_security_key !== void 0) payload.fawry_security_key = fawry_security_key || null;
    if (hmac_secret !== void 0) payload.hmac_secret = hmac_secret || null;
    if (existing.length === 0) {
      await db.insert(paymentSettingsTable).values(payload);
    } else {
      await db.update(paymentSettingsTable).set(payload).where(eq6(paymentSettingsTable.id, existing[0].id));
    }
    res.json({ success: true, message: "\u062A\u0645 \u062D\u0641\u0638 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u062F\u0641\u0639" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router14.delete("/keys", requireAuth8, async (_req, res) => {
  try {
    const existing = await db.select().from(paymentSettingsTable).limit(1);
    if (existing.length === 0) return res.json({ success: true });
    await db.update(paymentSettingsTable).set({
      api_key: null,
      integration_id_card: null,
      iframe_id_card: null,
      integration_id_wallet: null,
      iframe_id_wallet: null,
      fawry_merchant_code: null,
      fawry_security_key: null,
      hmac_secret: null,
      is_active: false,
      updated_at: /* @__PURE__ */ new Date()
    }).where(eq6(paymentSettingsTable.id, existing[0].id));
    res.json({ success: true, message: "\u062A\u0645 \u0645\u0633\u062D \u0645\u0641\u0627\u062A\u064A\u062D API" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var payment_settings_default = router14;

// artifacts/api-server/src/routes/agents.ts
import { Router as Router15 } from "express";
import { eq as eq7, asc as asc2, desc as desc3 } from "drizzle-orm";
import bcrypt3 from "bcryptjs";
var router15 = Router15();
function requireAuth9(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  next();
}
router15.get("/", requireAuth9, async (_req, res) => {
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
      created_at: agentsTable.created_at
    }).from(agentsTable).orderBy(asc2(agentsTable.name));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router15.get("/:id/orders", requireAuth9, async (req, res) => {
  try {
    const rows = await db.select().from(fieldOrdersTable).where(eq7(fieldOrdersTable.agent_id, req.params.id)).orderBy(desc3(fieldOrdersTable.created_at));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router15.get("/:id", requireAuth9, async (req, res) => {
  try {
    const [row] = await db.select().from(agentsTable).where(eq7(agentsTable.id, req.params.id));
    if (!row) return res.status(404).json({ message: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    const { password_hash, ...safe } = row;
    res.json(safe);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router15.post("/", requireAuth9, async (req, res) => {
  try {
    const { name, phone, zone, username, password, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ message: "\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0647\u0627\u062A\u0641 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    const insertData = { name, phone, zone, username, notes, is_active: true };
    if (password) insertData.password_hash = await bcrypt3.hash(password, 10);
    const [row] = await db.insert(agentsTable).values(insertData).returning();
    const { password_hash, ...safe } = row;
    res.status(201).json(safe);
  } catch (e) {
    if (e.message?.includes("unique")) return res.status(409).json({ message: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644" });
    res.status(500).json({ message: e.message });
  }
});
router15.patch("/:id", requireAuth9, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updateData = { ...rest, updated_at: /* @__PURE__ */ new Date() };
    if (password) updateData.password_hash = await bcrypt3.hash(password, 10);
    const [row] = await db.update(agentsTable).set(updateData).where(eq7(agentsTable.id, req.params.id)).returning();
    if (!row) return res.status(404).json({ message: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    const { password_hash, ...safe } = row;
    res.json(safe);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router15.patch("/:id/collected", requireAuth9, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount === void 0) return res.status(400).json({ message: "\u0627\u0644\u0645\u0628\u0644\u063A \u0645\u0637\u0644\u0648\u0628" });
    const [row] = await db.update(agentsTable).set({ total_collected: String(amount), updated_at: /* @__PURE__ */ new Date() }).where(eq7(agentsTable.id, req.params.id)).returning();
    if (!row) return res.status(404).json({ message: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    const { password_hash, ...safe } = row;
    res.json(safe);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router15.delete("/:id", requireAuth9, async (req, res) => {
  try {
    await db.delete(agentsTable).where(eq7(agentsTable.id, req.params.id));
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router15.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0637\u0644\u0648\u0628\u0629" });
    const [agent] = await db.select().from(agentsTable).where(eq7(agentsTable.username, username));
    if (!agent || !agent.is_active) return res.status(401).json({ message: "\u0628\u064A\u0627\u0646\u0627\u062A \u062F\u062E\u0648\u0644 \u062E\u0627\u0637\u0626\u0629 \u0623\u0648 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0648\u0642\u0648\u0641" });
    if (!agent.password_hash) return res.status(401).json({ message: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628" });
    const valid = await bcrypt3.compare(password, agent.password_hash);
    if (!valid) return res.status(401).json({ message: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
    req.session.agent = { id: agent.id, name: agent.name, zone: agent.zone };
    res.json({ ok: true, agent: { id: agent.id, name: agent.name, zone: agent.zone } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var agents_default = router15;

// artifacts/api-server/src/routes/field-orders.ts
import { Router as Router16 } from "express";
import { eq as eq8, desc as desc4 } from "drizzle-orm";
var router16 = Router16();
function requireAuth10(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  next();
}
router16.post("/", async (req, res) => {
  try {
    const {
      donor_name,
      donor_phone,
      address,
      zone,
      preferred_time,
      amount,
      campaign_id,
      campaign_title,
      order_type = "home_delivery",
      notes
    } = req.body;
    if (!donor_name || !donor_phone || !amount) {
      return res.status(400).json({ message: "\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0627\u0644\u0645\u0628\u0644\u063A \u0645\u0637\u0644\u0648\u0628\u0629" });
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
      notes
    }).returning();
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router16.get("/", requireAuth10, async (req, res) => {
  try {
    const { status, order_type } = req.query;
    let query = db.select().from(fieldOrdersTable).orderBy(desc4(fieldOrdersTable.created_at));
    const rows = await query;
    const filtered = rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (order_type && r.order_type !== order_type) return false;
      return true;
    });
    res.json(filtered);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router16.get("/:id", requireAuth10, async (req, res) => {
  try {
    const [row] = await db.select().from(fieldOrdersTable).where(eq8(fieldOrdersTable.id, req.params.id));
    if (!row) return res.status(404).json({ message: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router16.patch("/:id", requireAuth10, async (req, res) => {
  try {
    const { agent_id, status, admin_notes, ...rest } = req.body;
    const updateData = { ...rest, updated_at: /* @__PURE__ */ new Date() };
    if (status) updateData.status = status;
    if (admin_notes !== void 0) updateData.admin_notes = admin_notes;
    if (agent_id) {
      updateData.agent_id = agent_id;
      const [agent] = await db.select().from(agentsTable).where(eq8(agentsTable.id, agent_id));
      if (agent) {
        updateData.agent_name = agent.name;
        if (!status) updateData.status = "assigned";
      }
    }
    if (status === "collected") {
      updateData.collected_at = /* @__PURE__ */ new Date();
    }
    const [row] = await db.update(fieldOrdersTable).set(updateData).where(eq8(fieldOrdersTable.id, req.params.id)).returning();
    if (!row) return res.status(404).json({ message: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router16.delete("/:id", requireAuth10, async (req, res) => {
  try {
    await db.delete(fieldOrdersTable).where(eq8(fieldOrdersTable.id, req.params.id));
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router16.get("/agent/my-orders", async (req, res) => {
  try {
    const agent = req.session.agent;
    if (!agent) return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
    const rows = await db.select().from(fieldOrdersTable).where(eq8(fieldOrdersTable.agent_id, agent.id)).orderBy(desc4(fieldOrdersTable.created_at));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var field_orders_default = router16;

// artifacts/api-server/src/routes/backup.ts
import { Router as Router17 } from "express";
import { eq as eq9 } from "drizzle-orm";
var router17 = Router17();
function requireAuth11(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
  next();
}
router17.get("/export", requireAuth11, async (req, res) => {
  try {
    const format = req.query.format || "json";
    const [campaignsRes, donationsRes, settingsRes] = await Promise.all([
      supabase.from("campaigns").select("*").order("created_at"),
      supabase.from("donations").select("*").order("created_at"),
      supabase.from("settings").select("*")
    ]);
    const backup = {
      exported_at: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0",
      organization: "\u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629",
      campaigns: campaignsRes.data || [],
      donations: donationsRes.data || [],
      settings: settingsRes.data || [],
      stats: {
        total_campaigns: (campaignsRes.data || []).length,
        total_donations: (donationsRes.data || []).length,
        total_raised: (donationsRes.data || []).filter((d) => d.status === "approved").reduce((s, d) => s + Number(d.amount), 0)
      }
    };
    if (format === "csv") {
      const headers = ["id", "donor_name", "donor_phone", "campaign_title", "amount", "status", "payment_method", "operation_id", "refqa_id", "created_at"];
      const rows = backup.donations.map((d) => headers.map((h) => `"${(d[h] || "").toString().replace(/"/g, '""')}"`).join(","));
      const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=rafaqaa_donations_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
      return res.send(csv);
    }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=rafaqaa_backup_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`);
    res.json(backup);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router17.get("/stats", requireAuth11, async (_req, res) => {
  try {
    const [donRes, camRes] = await Promise.all([
      supabase.from("donations").select("id, status, amount, created_at").order("created_at", { ascending: false }),
      supabase.from("campaigns").select("id, status")
    ]);
    const donations = donRes.data || [];
    const campaigns = camRes.data || [];
    res.json({
      total_donations: donations.length,
      total_campaigns: campaigns.length,
      approved_donations: donations.filter((d) => d.status === "approved").length,
      pending_donations: donations.filter((d) => d.status === "pending").length,
      total_raised: donations.filter((d) => d.status === "approved").reduce((s, d) => s + Number(d.amount), 0),
      last_backup: null
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router17.post("/schedule", requireAuth11, async (req, res) => {
  try {
    const { frequency, email, enabled } = req.body;
    const existing = await db.select().from(settingsTable).where(eq9(settingsTable.key, "backup_schedule")).limit(1);
    const payload = { frequency, email, enabled, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    if (existing.length) {
      await db.update(settingsTable).set({ value: payload, updated_at: /* @__PURE__ */ new Date() }).where(eq9(settingsTable.key, "backup_schedule"));
    } else {
      await db.insert(settingsTable).values({ key: "backup_schedule", value: payload });
    }
    res.json({ success: true, message: "\u062A\u0645 \u062D\u0641\u0638 \u062C\u062F\u0648\u0644 \u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router17.get("/schedule", requireAuth11, async (_req, res) => {
  try {
    const row = await db.select().from(settingsTable).where(eq9(settingsTable.key, "backup_schedule")).limit(1);
    res.json(row[0]?.value || { frequency: "weekly", email: "", enabled: false });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
var backup_default = router17;

// artifacts/api-server/src/routes/install.ts
import { Router as Router18 } from "express";
import { execSync } from "child_process";
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var router18 = Router18();
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var ROOT = path2.resolve(__dirname2, "../../..");
function isInstalled() {
  return !!process.env.SUPABASE_URL && !!process.env.DATABASE_URL && process.env.NODE_ENV === "production";
}
router18.get("/status", (_req, res) => {
  res.json({ installed: isInstalled(), node_env: process.env.NODE_ENV });
});
router18.post("/test-db", async (req, res) => {
  const { database_url } = req.body;
  if (!database_url) return res.status(400).json({ ok: false, message: "DATABASE_URL \u0645\u0637\u0644\u0648\u0628" });
  try {
    const { default: pg2 } = await import("pg");
    const client = new pg2.Client({ connectionString: database_url });
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    res.json({ ok: true, message: "\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0646\u0627\u062C\u062D \u2713" });
  } catch (e) {
    res.json({ ok: false, message: `\u0641\u0634\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644: ${e.message}` });
  }
});
router18.post("/test-supabase", async (req, res) => {
  const { supabase_url, supabase_anon_key } = req.body;
  if (!supabase_url || !supabase_anon_key)
    return res.status(400).json({ ok: false, message: "\u0628\u064A\u0627\u0646\u0627\u062A Supabase \u0645\u0637\u0644\u0648\u0628\u0629" });
  try {
    const resp = await fetch(`${supabase_url}/rest/v1/campaigns?limit=1`, {
      headers: {
        "apikey": supabase_anon_key,
        "Authorization": `Bearer ${supabase_anon_key}`
      }
    });
    if (resp.ok || resp.status === 416) {
      res.json({ ok: true, message: "\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0640 Supabase \u0646\u0627\u062C\u062D \u2713" });
    } else {
      const text2 = await resp.text();
      res.json({ ok: false, message: `Supabase \u0631\u062F \u0628\u0640 ${resp.status}: ${text2.slice(0, 120)}` });
    }
  } catch (e) {
    res.json({ ok: false, message: `\u0641\u0634\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0640 Supabase: ${e.message}` });
  }
});
router18.post("/test-paymob", async (req, res) => {
  const { paymob_api_key } = req.body;
  if (!paymob_api_key) return res.json({ ok: true, message: "\u062A\u0645 \u062A\u062E\u0637\u064A Paymob (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)" });
  try {
    const resp = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: paymob_api_key })
    });
    if (resp.ok) res.json({ ok: true, message: "Paymob API Key \u0635\u062D\u064A\u062D \u2713" });
    else res.json({ ok: false, message: `Paymob: \u0645\u0641\u062A\u0627\u062D \u063A\u064A\u0631 \u0635\u062D\u064A\u062D (HTTP ${resp.status})` });
  } catch (e) {
    res.json({ ok: false, message: `\u0641\u0634\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0640 Paymob: ${e.message}` });
  }
});
router18.post("/test-telegram", async (req, res) => {
  const { telegram_bot_token } = req.body;
  if (!telegram_bot_token) return res.json({ ok: true, message: "\u062A\u0645 \u062A\u062E\u0637\u064A Telegram (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)" });
  try {
    const resp = await fetch(`https://api.telegram.org/bot${telegram_bot_token}/getMe`);
    const data = await resp.json();
    if (data.ok) res.json({ ok: true, message: `Telegram Bot: @${data.result.username} \u2713` });
    else res.json({ ok: false, message: "Telegram Token \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
  } catch (e) {
    res.json({ ok: false, message: `\u0641\u0634\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0640 Telegram: ${e.message}` });
  }
});
router18.post("/run", async (req, res) => {
  if (isInstalled()) {
    return res.status(403).json({ ok: false, message: "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0645\u062B\u0628\u0651\u062A \u0628\u0627\u0644\u0641\u0639\u0644" });
  }
  const {
    database_url,
    supabase_url,
    supabase_anon_key,
    supabase_service_role_key,
    session_secret,
    paymob_api_key = "",
    paymob_integration_id = "",
    paymob_iframe_id = "",
    paymob_hmac_secret = "",
    telegram_bot_token = "",
    telegram_chat_id = "",
    whatsapp_token = "",
    whatsapp_phone_id = "",
    ultramsg_instance = "",
    ultramsg_token = "",
    smtp_host = "",
    smtp_port = "587",
    smtp_user = "",
    smtp_pass = "",
    smtp_from = "",
    frontend_url = ""
  } = req.body;
  const missing = [];
  if (!database_url) missing.push("DATABASE_URL");
  if (!supabase_url) missing.push("SUPABASE_URL");
  if (!supabase_anon_key) missing.push("SUPABASE_ANON_KEY");
  if (!supabase_service_role_key) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!session_secret) missing.push("SESSION_SECRET");
  if (missing.length) {
    return res.status(400).json({ ok: false, message: `\u062D\u0642\u0648\u0644 \u0645\u0637\u0644\u0648\u0628\u0629: ${missing.join(", ")}` });
  }
  const envContent = `# \u0631\u0641\u0642\u0627\u0621 \u0627\u0644\u0628\u0631\u0631\u0629 \u2014 \u062A\u0645 \u0627\u0644\u062A\u062B\u0628\u064A\u062A \u0628\u0648\u0627\u0633\u0637\u0629 Install Wizard \u2014 ${(/* @__PURE__ */ new Date()).toLocaleString("ar-EG")}

DATABASE_URL=${database_url}
SUPABASE_URL=${supabase_url}
SUPABASE_ANON_KEY=${supabase_anon_key}
SUPABASE_SERVICE_ROLE_KEY=${supabase_service_role_key}
SESSION_SECRET=${session_secret}
NODE_ENV=production
PAYMOB_API_KEY=${paymob_api_key}
PAYMOB_INTEGRATION_ID=${paymob_integration_id}
PAYMOB_IFRAME_ID=${paymob_iframe_id}
PAYMOB_HMAC_SECRET=${paymob_hmac_secret}
TELEGRAM_BOT_TOKEN=${telegram_bot_token}
TELEGRAM_CHAT_ID=${telegram_chat_id}
WHATSAPP_TOKEN=${whatsapp_token}
WHATSAPP_PHONE_ID=${whatsapp_phone_id}
ULTRAMSG_INSTANCE=${ultramsg_instance}
ULTRAMSG_TOKEN=${ultramsg_token}
SMTP_HOST=${smtp_host}
SMTP_PORT=${smtp_port}
SMTP_USER=${smtp_user}
SMTP_PASS=${smtp_pass}
SMTP_FROM=${smtp_from}
FRONTEND_URL=${frontend_url}
`;
  try {
    const apiServerDir = path2.resolve(ROOT, "artifacts/api-server");
    fs2.writeFileSync(path2.join(apiServerDir, ".env"), envContent, "utf-8");
    const frontendDir = path2.resolve(ROOT, "artifacts/rafaqaa-website");
    fs2.writeFileSync(path2.join(frontendDir, ".env"), "VITE_API_URL=\n", "utf-8");
    execSync(
      `DATABASE_URL="${database_url}" pnpm --filter @workspace/api-server run db:push`,
      { cwd: ROOT, stdio: "pipe", env: { ...process.env, DATABASE_URL: database_url }, timeout: 6e4 }
    );
    res.json({
      ok: true,
      message: "\u062A\u0645 \u0627\u0644\u062A\u062B\u0628\u064A\u062A \u0628\u0646\u062C\u0627\u062D!",
      credentials: {
        admin: { username: "admin", password: "admin123" },
        supervisor: { username: "supervisor", password: "Rafaqaa@Sup2025" }
      },
      next_steps: [
        "\u063A\u064A\u0651\u0631 \u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 \u0641\u0648\u0631 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
        "\u0627\u0631\u0641\u0639 \u0627\u0644\u0643\u0648\u062F \u0639\u0644\u0649 GitHub \u0648\u0627\u0646\u0634\u0631\u0647 \u0639\u0644\u0649 Vercel",
        "\u0623\u0636\u0641 \u0646\u0641\u0633 \u0627\u0644\u0645\u062A\u063A\u064A\u0631\u0627\u062A \u0641\u064A Vercel \u2192 Environment Variables"
      ]
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: `\u0641\u0634\u0644 \u0627\u0644\u062A\u062B\u0628\u064A\u062A: ${e.message || e}` });
  }
});
var install_default = router18;

// artifacts/api-server/src/routes/index.ts
var router19 = Router19();
router19.use(health_default);
router19.use("/auth", auth_default);
router19.use("/campaigns", campaigns_default);
router19.use("/donations", donations_default);
router19.use("/settings", settings_default);
router19.use("/audit-logs", audit_logs_default);
router19.use("/upload", upload_default);
router19.use("/stats", stats_default);
router19.use("/admin-users", admin_users_default);
router19.use("/permission-types", permission_types_default);
router19.use("/banners", banners_default);
router19.use("/payments", payments_default);
router19.use("/payment-settings", payment_settings_default);
router19.use("/agents", agents_default);
router19.use("/field-orders", field_orders_default);
router19.use("/notifications", notifications_default);
router19.use("/backup", backup_default);
router19.use("/install", install_default);
var routes_default = router19;

// artifacts/api-server/src/lib/logger.ts
import pino from "pino";
var isProduction = process.env.NODE_ENV === "production";
var logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']"
  ],
  ...isProduction ? {} : {
    transport: {
      target: "pino-pretty",
      options: { colorize: true }
    }
  }
});

// artifacts/api-server/src/app.ts
var __dirname3 = path3.dirname(fileURLToPath3(import.meta.url));
var app = express();
app.set("trust proxy", 1);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      }
    }
  })
);
var allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"] : true;
app.use(cors({ credentials: true, origin: allowedOrigins }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
var sessionStore;
if (process.env.DATABASE_URL) {
  try {
    const { default: connectPgSimple } = await import("connect-pg-simple");
    const PgSession = connectPgSimple(session);
    sessionStore = new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "user_sessions",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 60
      // prune expired sessions every hour
    });
  } catch (err) {
    logger.warn({ err }, "connect-pg-simple failed \u2014 falling back to memory store");
  }
}
var isProduction2 = process.env.NODE_ENV === "production";
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "rafaqaa-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    name: "rafaqaa.sid",
    cookie: {
      httpOnly: true,
      secure: isProduction2,
      sameSite: isProduction2 ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    }
  })
);
var uploadsDir2 = path3.join(__dirname3, "..", "uploads");
app.use("/api/uploads", express.static(uploadsDir2));
app.use("/api", routes_default);
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "Rafaqaa API", env: process.env.NODE_ENV });
});
var app_default = app;

// api/index.ts
var index_default = app_default;
export {
  index_default as default
};
