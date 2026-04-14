import {
  pgTable, text, uuid, numeric, timestamp, jsonb, integer, boolean, serial
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignsTable = pgTable("campaigns", {
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
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const donationsTable = pgTable("donations", {
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
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const settingsTable = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: text("action").notNull(),
  table_name: text("table_name"),
  record_id: text("record_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// --- نظام المستخدمين والصلاحيات ---

export const permissionTypesTable = pgTable("permission_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().default("{}"),
  color: text("color").default("blue"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const adminUsersTable = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  display_name: text("display_name"),
  permission_type_id: uuid("permission_type_id"),
  is_active: boolean("is_active").notNull().default(true),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// --- البانرات ---

export const bannersTable = pgTable("banners", {
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
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// --- المناديب الميدانيون ---

export const agentsTable = pgTable("agents", {
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
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// --- طلبات التحصيل (دفع منزلي + مناديب) ---

export const fieldOrdersTable = pgTable("field_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_type: text("order_type").notNull().default("home_delivery"), // home_delivery | agent
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
  status: text("status").notNull().default("pending"), // pending | assigned | collected | failed | cancelled
  notes: text("notes"),
  admin_notes: text("admin_notes"),
  collected_at: timestamp("collected_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// --- إعدادات بوابة الدفع ---

export const paymentSettingsTable = pgTable("payment_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull().default("demo"), // demo | paymob | fawry
  is_active: boolean("is_active").notNull().default(false),
  test_mode: boolean("test_mode").notNull().default(true),
  label: text("label").default("بوابة الدفع الإلكتروني"),
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
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export type PaymentSettings = typeof paymentSettingsTable.$inferSelect;

// Zod schemas
export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, created_at: true, updated_at: true });
export const insertDonationSchema = createInsertSchema(donationsTable).omit({ id: true, created_at: true });
export const insertSettingSchema = createInsertSchema(settingsTable);
export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({ id: true, created_at: true });
export const insertPermissionTypeSchema = createInsertSchema(permissionTypesTable).omit({ id: true, created_at: true, updated_at: true });
export const insertAdminUserSchema = createInsertSchema(adminUsersTable).omit({ id: true, created_at: true, updated_at: true, password_hash: true });
export const insertBannerSchema = createInsertSchema(bannersTable).omit({ id: true, created_at: true, updated_at: true });
export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true, created_at: true, updated_at: true, password_hash: true });
export const insertFieldOrderSchema = createInsertSchema(fieldOrdersTable).omit({ id: true, created_at: true, updated_at: true });

export type Campaign = typeof campaignsTable.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Donation = typeof donationsTable.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Setting = typeof settingsTable.$inferSelect;
export type AuditLog = typeof auditLogsTable.$inferSelect;
export type PermissionType = typeof permissionTypesTable.$inferSelect;
export type AdminUser = typeof adminUsersTable.$inferSelect;
export type Banner = typeof bannersTable.$inferSelect;
export type Agent = typeof agentsTable.$inferSelect;
export type FieldOrder = typeof fieldOrdersTable.$inferSelect;
