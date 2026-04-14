# رفقاء البررة — موقع التبرع

## Overview

موقع جمعية خيرية بالكامل مبني على pnpm monorepo مع React + Vite للفرونت وExpress API للباكند. البيانات التجارية (حملات وتبرعات) على Supabase، والنظام الإداري (مستخدمون وصلاحيات وبانرات) على PostgreSQL محلي.

## آخر التحديثات (v2.1)
- **Kill Switch (site_disabled)**: إيقاف كامل للموقع من لوحة التحكم مع رسالة صيانة مخصصة. يوقف الدفع ويعرض maintenance page.
- **Feature Flags محسّنة**: إضافة home_delivery, agent_donations — تفعّل/تعطّل طرق الدفع في DonationModal فعلياً.
- **نظام المناديب محسّن**: 3 تبويبات — قائمة المناديب، طلبات مندوب معين (linked to field_orders)، تقارير الأداء مع ترتيب وشريط تقدم.
- **إصلاح session store**: connect-pg-simple أصبح external في ESBuild لأنه يقرأ ملف SQL.
- **README.md احترافي**: شامل لكل الـ stack والـ API وجداول Supabase والمتغيرات.
- **أمان**: SAST scan نظيف، 0 critical vulnerabilities في الكود.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS v4 + Framer Motion
- **Backend**: Express 5 + TypeScript + Drizzle ORM + PostgreSQL (local) + Supabase (business data)
- **Auth**: Session-based (express-session + bcryptjs) — admin only; `sameSite: none, secure: true, trust proxy: 1` for Replit HTTPS
- **File upload**: multer → /api/uploads/receipts/
- **RTL**: Arabic (Tajawal + Amiri fonts), direction: rtl

## Artifacts

### `artifacts/rafaqaa-website` — الموقع الأمامي
- URL: `/` (port from $PORT env)
- Pages: Index, Admin, Auth, Profile, Zakat, Policy, NotFound, **TrackDonation** (/track)
- Design system: HSL color tokens with green (#10B981) primary + gold (#D4AF37) secondary
- Components: HeroSection, CampaignsSection, DonationModal, DonationTicker, HomeBanners, Navbar, **SplashScreen**, etc.
- Contexts: AuthContext, FeatureFlagsContext (+ refreshFlags), **SocialLinksContext** (social media + WhatsApp)
- Admin components: AdminDonations (Excel editing + sequential tracking + **delete**), AdminUsers, AdminBanners, AdminCampaigns, AdminAnalytics, **AdminSettings** (5 tabs: general/social/whatsapp/SEO/flags), AdminSecurity, AdminAuditLogs, AdminPayments, AdminSuccessStories, AdminAgents, AdminFieldOrders
- **NEW**: AdminPaymentGateway, AdminNotifications, AdminSEO, AdminBackup
- **Navbar**: Login button hidden from public — only visible when logged in
- **TopBar**: Dynamic social media links from settings
- **Footer**: Social media icons + track link + developer credit (dynamic from settings)

### `artifacts/api-server` — الخادم الخلفي
- URL: `/api` (port 8080)
- Routes:
  - `GET/POST /api/campaigns` — CRUD للحملات (Supabase)
  - `GET/POST/PATCH /api/donations` — CRUD للتبرعات (Supabase); PATCH يُحدّث الحالة + رفع الحملة
  - `GET/PUT /api/settings/:key` — إعدادات key-value (Supabase)
  - `GET/POST /api/audit-logs` — سجل العمليات (Supabase)
  - `POST /api/auth/login` — تسجيل الدخول (local admin_users table)
  - `GET /api/auth/me` — الجلسة الحالية
  - `POST /api/auth/logout` — تسجيل الخروج
  - `POST /api/upload/receipt` — رفع إيصالات التبرع
  - `GET /api/stats` — إحصائيات عامة
  - `GET/POST/PATCH/DELETE /api/admin-users` — مستخدمو الإدارة (local PG)
  - `GET/POST/PATCH/DELETE /api/permission-types` — أنواع الصلاحيات (local PG)
  - `GET/POST/PATCH/DELETE /api/banners` — البانرات الترويجية (local PG)
  - `GET /api/payment-settings/status` — حالة بوابة الدفع (عامة)
  - `GET/POST /api/payment-settings` — إعدادات بوابة الدفع (admin)
  - `POST /api/payments/initiate` — بدء عملية دفع (Paymob / Fawry / Demo) مع Refqa-ID تسلسلي
  - `POST /api/payments/webhook/paymob` — webhook من Paymob بعد الدفع
  - `POST /api/payments/demo/confirm/:refqaId` — تأكيد دفع تجريبي
  - `GET/POST/PATCH/DELETE /api/agents` — المناديب الميدانيون (local PG)
  - `GET/POST/PATCH/DELETE /api/field-orders` — طلبات التحصيل المنزلي (local PG)
  - `PATCH /api/donations/:id/status` — تحديث حالة التبرع (approved/rejected) مع auto-notify
  - `GET /api/notifications/settings` — قراءة إعدادات الإشعارات (محجوبة - tokens مخفية)
  - `POST /api/notifications/settings` — حفظ إعدادات قسم محدد (telegram/whatsapp/twilio/email)
  - `POST /api/notifications/telegram/set-token` — حفظ Bot Token و Chat ID
  - `POST /api/notifications/telegram/test` — إرسال رسالة اختبار
  - `POST /api/notifications/whatsapp/set-token` — حفظ WhatsApp API credentials
  - `POST /api/notifications/whatsapp/test` — إرسال واتساب تجريبي
  - `POST /api/notifications/twilio/set-credentials` — حفظ Twilio credentials
  - `POST /api/notifications/twilio/test` — إرسال SMS تجريبي
  - `POST /api/notifications/email/set-credentials` — حفظ SMTP settings
  - `POST /api/notifications/email/test` — إرسال إيميل اختبار
  - `GET /api/backup/export?format=json|csv` — تصدير البيانات (JSON كامل أو CSV التبرعات)
  - `GET /api/backup/stats` — إحصائيات البيانات
  - `GET/POST /api/backup/schedule` — جدولة النسخ التلقائي

## Notifications Auto-flow

- **تبرع جديد (POST /api/donations)**: Telegram notification تلقائي
- **اعتماد تبرع (PATCH /api/donations/:id/status → approved)**: Telegram + WhatsApp شكر للمتبرع + إيميل شكر مع إيصال
- **رفض تبرع**: Telegram notification
- **Paymob webhook تأكيد**: Telegram + WhatsApp تلقائي للمتبرع
- **Demo payment تأكيد**: Telegram + WhatsApp تلقائي

## Database

### Supabase (Business data)
- `campaigns` — الحملات
- `donations` — التبرعات
- `settings` — إعدادات key-value
- `audit_logs` — سجل العمليات

### Local PostgreSQL (Drizzle ORM) — Admin system
- `admin_users` — مستخدمو الإدارة (id, username, display_name, password_hash, permission_type_id, is_active, last_login)
- `permission_types` — أنواع الصلاحيات (id, name, description, permissions jsonb, color)
- `banners` — البانرات الترويجية (id, title, subtitle, badge_text, image_url, link_url, link_text, bg_color, display_order, is_active)

## Admin Credentials

- Default: username = `admin`, password = `admin123`
- Stored as bcrypt hash in `admin_users` table (local PostgreSQL)
- Seeded automatically on API server startup
- Permission system: مدير كامل / مشرف تبرعات / متابع فقط (3 default roles)

## Admin Features

### AdminDonations — إدارة التبرعات
- **Excel-style inline editing**: Click on donor_name or amount cell to edit inline (Enter = save, Escape = cancel)
- **Sequential tracking**: Configurable start number in localStorage `donation_seq_start`; shows sequence # per row
- **Stats bar**: Clickable cards filter by status (pending/approved/rejected)
- **Sortable columns**: Click column headers (amount, status, created_at)
- **CSV export**: Includes sequence numbers in export

### AdminUsers — إدارة المستخدمين والصلاحيات
- **Users tab**: Create/edit/toggle-active/delete admin users with role assignment
- **Roles tab**: 8 granular permissions (manage_campaigns, manage_donations, approve_donations, manage_settings, manage_banners, manage_users, view_reports, delete_records)
- **Color coding**: Each role has a color indicator

### AdminBanners — إدارة البانرات
- Create/edit/delete/toggle-visibility banners
- Live preview in modal while editing
- 6 background colors, badge text, image URL, CTA button link

### HomeBanners — عرض البانرات في الموقع
- Auto-sliding carousel (5s interval, pauses on hover)
- RTL navigation arrows + dot indicators
- Framer Motion slide animations
- Only shows active banners

## Operation ID Format

`REF-YYMMDD-XXXXXX` — generated client-side via `generateOperationId()` in supabase-helpers.ts

## Key Files

- `artifacts/rafaqaa-website/src/lib/api-client.ts` — fetch wrapper, base URL `/api`
- `artifacts/rafaqaa-website/src/lib/supabase-helpers.ts` — all data helper functions
- `artifacts/rafaqaa-website/src/contexts/AuthContext.tsx` — session-based auth
- `artifacts/rafaqaa-website/src/index.css` — full design system with HSL tokens
- `artifacts/api-server/src/lib/supabase.ts` — Supabase client (SUPABASE_URL, SUPABASE_ANON_KEY)
- `artifacts/api-server/src/app.ts` — Express app with session middleware (trust proxy)
- `artifacts/api-server/src/routes/` — all API route files
- `lib/db/src/schema/index.ts` — Drizzle ORM schema (admin_users, permission_types, banners)

## Development

```bash
# Install packages
pnpm install

# Push DB schema (local admin tables)
pnpm --filter @workspace/db push-force

# Start development (both workflows auto-start)
# API: port 8080, Website: $PORT
```

## Structure

```
artifacts/
├── api-server/         # Express API (port 8080, /api)
│   └── src/
│       ├── routes/     # campaigns, donations, auth, settings, upload, stats, admin-users, permission-types, banners
│       └── lib/        # supabase.ts (Supabase client)
├── rafaqaa-website/    # React + Vite frontend
│   └── src/
│       ├── components/ # UI components (admin/, HomeBanners, HeroSection, etc.)
│       ├── contexts/   # AuthContext, BasketContext, ThemeContext, FeatureFlags
│       ├── pages/      # Index, Admin, Auth, Profile, Zakat, Policy
│       └── lib/        # api-client, supabase-helpers
lib/
├── db/                 # Drizzle schema + DB connection (local PG)
└── api-spec/           # OpenAPI spec
```
