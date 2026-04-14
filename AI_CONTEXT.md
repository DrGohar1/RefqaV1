# 🤖 AI_CONTEXT.md — رفقاء البررة | دليل التطوير الشامل

> **للـ AI القادم**: اقرأ هذا الملف بالكامل قبل أي تعديل. يحتوي على كل شيء عن المشروع — معماريته، قاعدة بياناته، كوده، وما يريده صاحب المشروع مستقبلاً.

---

## 📌 نظرة عامة

**رفقاء البررة** — موقع جمعية خيرية مصرية مرخصة من وزارة التضامن الاجتماعي (رقم 7932).
الموقع يجمع تبرعات للحملات الخيرية مع نظام إدارة متكامل.

**اللغة**: عربي كامل (RTL) مع كود TypeScript
**اتجاه النص**: `dir="rtl"` في كل مكان
**صاحب المشروع**: يعمل على Windows، يرفع الكود عبر GitHub

---

## 🏗️ معمارية المشروع (pnpm Monorepo)

```
/home/runner/workspace/
├── artifacts/
│   ├── rafaqaa-website/     ← Frontend (React + Vite) | PORT=$PORT | Preview: /
│   ├── api-server/          ← Backend (Express) | PORT=8080 | Prefix: /api
│   └── mockup-sandbox/      ← Canvas preview server | PORT=8081
├── lib/
│   └── db/                  ← Drizzle ORM schema + local PostgreSQL
├── pnpm-workspace.yaml
├── package.json
├── replit.md                ← ملخص تقني قصير
└── AI_CONTEXT.md            ← هذا الملف (التوثيق الكامل)
```

---

## 🗄️ قواعد البيانات (هجين)

### 1. Supabase — البيانات التجارية (العامة)
**الجداول:**
- `campaigns` — الحملات الخيرية
- `donations` — التبرعات (+ refqa_id + gateway_transaction_id + confirmed_at)
- `settings` — إعدادات key-value (SEO, payment_methods, feature_flags)
- `success_stories` — قصص النجاح

**عمود `refqa_id`**: تسلسلي بصيغة `Refqa-YYYYMMDD-XXXX` (مثال: `Refqa-20260329-0001`)

### 2. PostgreSQL المحلي (Drizzle ORM) — النظام الإداري
**الجداول (في `lib/db/src/schema/index.ts`):**
```typescript
// المستخدمون الإداريون
admin_users: { id, username, password_hash, display_name, role, email, is_active, permissions(jsonb) }
// أنواع الصلاحيات
permission_types: { id, name, label, description }
// البانرات
banners: { id, title, subtitle, image_url, cta_text, cta_link, is_active, order_index, expires_at }
// إعدادات بوابة الدفع الإلكترونية
payment_settings: { id, provider, api_key, integration_id_card, integration_id_wallet, iframe_id_card, iframe_id_wallet, hmac_secret, test_mode, is_active }
// المناديب الميدانيون
agents: { id, name, phone, area, is_active, created_at }
// طلبات التحصيل الميداني
field_orders: { id, donor_name, donor_phone, address, area, amount, campaign_id, campaign_title, status, agent_id, notes, created_at }
// إعدادات عامة (local) — للإشعارات والنسخ الاحتياطي
settings: { key(PK), value(jsonb), updated_at }
```

**أوامر DB:**
```bash
pnpm --filter @workspace/db run push        # sync schema بدون force
pnpm --filter @workspace/db run push-force  # force sync
```

---

## 👤 مستخدمو الإدارة

| username | password | دور | الصلاحيات |
|---|---|---|---|
| admin | admin123 | admin | كل الصلاحيات |
| supervisor | Rafaqaa@Sup2025 | moderator | إدارة التبرعات والحملات |
| data_entry | Rafaqaa@Data2025 | data_entry | إدخال بيانات |
| viewer | Rafaqaa@View2025 | viewer | قراءة فقط |

---

## 🔌 API Routes الكاملة

**Base URL:** `http://localhost:8080/api`
**Auth:** Session cookies — تسجيل الدخول عبر `POST /api/auth/login`

### Auth
```
POST   /api/auth/login           { username, password } → { user }
GET    /api/auth/me              → user session
POST   /api/auth/logout          → clear session
```

### Campaigns (Supabase)
```
GET    /api/campaigns            → قائمة الحملات
GET    /api/campaigns/:id        → حملة واحدة
POST   /api/campaigns            → إنشاء حملة (admin)
PATCH  /api/campaigns/:id        → تعديل حملة (admin)
DELETE /api/campaigns/:id        → حذف حملة (admin)
```

### Donations (Supabase)
```
GET    /api/donations            → جميع التبرعات (query: status, _limit, date_from, date_to)
GET    /api/donations/:id        → تبرع واحد
POST   /api/donations            → إنشاء تبرع + Telegram notification تلقائي
PATCH  /api/donations/:id        → تعديل عام
PATCH  /api/donations/:id/status → { status: approved|rejected, notes } → يحدث الحملة + يرسل إشعارات تلقائياً
```

### Payments (بوابة الدفع الإلكترونية)
```
POST   /api/payments/initiate               → { amount, donor_name, donor_phone, donor_email, campaign_id, campaign_title, integration_type }
                                               → { refqa_id, payment_url, demo_mode }
GET    /api/payments/status/:refqaId        → حالة الدفع
POST   /api/payments/demo/confirm/:refqaId  → تأكيد تجريبي + notifications
POST   /api/payments/paymob/callback        → Paymob webhook (HMAC verified) + notifications
```

### Payment Settings
```
GET    /api/payment-settings/status         → حالة البوابة (عام)
GET    /api/payment-settings                → الإعدادات الكاملة (admin)
POST   /api/payment-settings                → حفظ إعدادات
```

### Notifications (إعدادات الإشعارات — local DB)
```
GET    /api/notifications/settings              → الإعدادات (tokens مخفية)
POST   /api/notifications/settings             → { section: telegram|whatsapp|twilio|email, ...fields }

POST   /api/notifications/telegram/set-token   → { bot_token, chat_id }
POST   /api/notifications/telegram/test        → اختبار إرسال

POST   /api/notifications/whatsapp/set-token   → { token, phone_number_id, api_url? }
POST   /api/notifications/whatsapp/test        → { test_phone }

POST   /api/notifications/twilio/set-credentials → { account_sid, auth_token }
POST   /api/notifications/twilio/test          → { test_phone }

POST   /api/notifications/email/set-credentials → { smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name }
POST   /api/notifications/email/test           → { test_email }
```

### Backup
```
GET    /api/backup/export?format=json|csv   → تحميل ملف (auth required)
GET    /api/backup/stats                    → إحصائيات البيانات
GET    /api/backup/schedule                 → جدول النسخ التلقائي
POST   /api/backup/schedule                 → { frequency: daily|weekly|monthly, email, enabled }
```

### Admin Management (local DB)
```
GET/POST/PATCH/DELETE   /api/admin-users
GET/POST/PATCH/DELETE   /api/permission-types
GET/POST/PATCH/DELETE   /api/banners
GET/POST/PATCH/DELETE   /api/agents
GET/POST/PATCH/DELETE   /api/field-orders
```

### Settings (Supabase)
```
GET    /api/settings/:key    → { value }
PUT    /api/settings/:key    → { value } (admin)
```

**المفاتيح المستخدمة:**
- `seo` — إعدادات SEO (title, description, keywords, og_image, etc.)
- `payment_methods` — بوابات الدفع اليدوي
- `feature_flags` — ميزات تجريبية

### Other
```
GET    /api/stats        → إحصائيات عامة (donations, campaigns, agents counts)
GET    /api/audit-logs   → سجل العمليات
POST   /api/audit-logs   → تسجيل عملية
POST   /api/upload/receipt → multipart/form-data → { url }
```

---

## 🔔 الإشعارات التلقائية (Auto-notify Flow)

يتم الإرسال تلقائياً من الـ backend — لا يحتاج تدخل يدوي:

```
تبرع جديد (POST /api/donations)
  └── Telegram: "💰 تبرع جديد - اسم + مبلغ + طريقة دفع"

اعتماد تبرع (PATCH .../status → approved)
  ├── Telegram: "✅ تم اعتماد تبرع - التفاصيل"
  ├── WhatsApp → المتبرع: رسالة شكر مخصصة (نص قابل للتعديل من الإدارة)
  └── Email → donor_email: HTML جميل مع الإيصال

رفض تبرع (PATCH .../status → rejected)
  └── Telegram: "❌ تم رفض تبرع - السبب"

Paymob Webhook تأكيد
  ├── Telegram: "✅ تم تأكيد دفع Paymob"
  └── WhatsApp → المتبرع: شكر + رقم Refqa

Demo Payment تأكيد
  ├── Telegram: "✅ تم تأكيد دفع تجريبي"
  └── WhatsApp → المتبرع (إذا متاح)
```

**التفعيل**: كل قناة تحتاج تفعيل من لوحة التحكم (الإشعارات → القسم المطلوب → تفعيل + حفظ credentials)

---

## 💳 تدفق الدفع الإلكتروني

```
1. المتبرع يختار حملة ويضغط "تبرع الآن"
2. DonationModal.tsx → POST /api/payments/initiate
3. Backend يولّد refqa_id (Refqa-YYYYMMDD-XXXX)
4. إذا Demo Mode: يعود مباشرة بـ refqa_id
   إذا Paymob: يسجّل order في Paymob → يرجع payment_url (iframe)
5. Frontend يفتح /pay?refqa_id=XXX&payment_url=XXX
6. PaymentPage.tsx تعرض iframe الدفع أو تأكيد تجريبي
7. بعد الدفع: Paymob يرسل webhook → /api/payments/paymob/callback
8. Backend يحدّث الحالة → approved → يزيد raised_amount للحملة → يرسل إشعارات
```

**Demo Mode**: يُفعّل تلقائياً إذا لم تُكمل إعدادات Paymob (api_key + integration_id)
**زر التأكيد التجريبي**: يظهر في PaymentPage.tsx في demo mode

---

## 🎨 Frontend — الصفحات والمكونات

### الصفحات (`artifacts/rafaqaa-website/src/pages/`)
| الملف | الرابط | الوصف |
|---|---|---|
| `Index.tsx` | `/` | الصفحة الرئيسية |
| `Admin.tsx` | `/admin` | لوحة التحكم الكاملة |
| `Auth.tsx` | `/auth` | تسجيل الدخول |
| `PaymentPage.tsx` | `/pay` | صفحة الدفع المستقلة |
| `Profile.tsx` | `/profile` | ملف المتبرع |
| `Zakat.tsx` | `/zakat` | حاسبة الزكاة |
| `Policy.tsx` | `/privacy-policy` | سياسة الخصوصية |

### مكونات الموقع الرئيسية (`src/components/`)
| المكون | الوصف |
|---|---|
| `HeroSection.tsx` | القسم الأول مع CTA |
| `CampaignsSection.tsx` | عرض الحملات مع progress bars |
| `DonationModal.tsx` | نافذة التبرع (4 طرق دفع) → POST /api/payments/initiate |
| `DonationTicker.tsx` | شريط التبرعات المتحرك (live من Supabase) |
| `HomeBanners.tsx` | كاروسيل البانرات (auto-play, pause on hover) |
| `Navbar.tsx` | شريط التنقل |
| `Footer.tsx` | التذييل |
| `ZakatCalculator.tsx` | حاسبة الزكاة |

### لوحة التحكم (`src/components/admin/`)

#### السيدبار — 10 مجموعات
```
1. الرئيسية
   └── لوحة التحكم (AdminAnalytics)

2. إدارة التبرعات
   ├── جميع التبرعات
   ├── قيد المراجعة
   ├── المعتمدة
   └── المرفوضة
   └── Component: AdminDonations.tsx

3. إدارة الحملات
   ├── كل الحملات (AdminCampaigns.tsx — Excel-style inline editing)
   └── قصص النجاح (AdminSuccessStories.tsx)

4. بوابة الدفع الإلكتروني ← جديد
   ├── كل العمليات
   ├── قيد المراجعة (badge بعدد المعلقة)
   ├── المعتمدة
   ├── المرفوضة
   ├── التقارير المالية (charts + stats)
   └── إعدادات البوابة
   └── Component: AdminPaymentGateway.tsx

5. الدفع اليدوي والمناديب
   ├── بوابات الدفع اليدوي (AdminPayments.tsx)
   ├── المناديب الميدانيون (AdminAgents.tsx)
   └── طلبات التحصيل (AdminFieldOrders.tsx)

6. الإشعارات والتواصل ← جديد
   ├── تيليجرام بوت
   ├── واتساب API
   ├── Twilio SMS
   └── البريد الإلكتروني
   └── Component: AdminNotifications.tsx (initialTab prop)

7. SEO وتحسين البحث ← جديد
   └── إعدادات SEO (AdminSEO.tsx — live preview Google/Facebook/Twitter)

8. النسخ الاحتياطي ← جديد
   └── نسخ واسترداد (AdminBackup.tsx — JSON/CSV + auto-schedule)

9. المستخدمين والمحتوى
   ├── إدارة الأدوار (AdminUsers.tsx)
   └── البانرات الترويجية (AdminBanners.tsx)

10. النظام والأمان
    ├── الحماية والتشفير (AdminSecurity.tsx)
    ├── سجل العمليات (AdminAuditLogs.tsx)
    └── الإعدادات العامة (AdminSettings.tsx)
```

---

## 📋 وصف تفصيلي لكل مكون Admin

### `AdminAnalytics.tsx`
- إحصائيات: إجمالي التبرعات، المحصّل، الحملات، المتبرعين
- رسم بياني للتبرعات اليومية
- آخر التبرعات

### `AdminDonations.tsx`
- جدول قابل للفلتر (status, date, search)
- كل صف: اسم، هاتف، مبلغ، حملة، رقم Refqa، الحالة، الإجراءات
- أزرار: اعتماد / رفض / عرض إيصال
- رفع الإيصال + معاينة الصورة
- **Props**: `filterStatus?: "pending" | "approved" | "rejected"`

### `AdminCampaigns.tsx`
- **Excel-style**: انقر على أي خلية للتعديل المباشر
- الأعمدة: العنوان، المستهدف، المحصّل، نسبة الإنجاز، الأيام، الحالة
- فرز تصاعدي/تنازلي لكل عمود
- إضافة/حذف/نشر/إيقاف

### `AdminPaymentGateway.tsx` ← جديد
- **Props**: `initialTab?: "all" | "pending" | "approved" | "rejected" | "reports"`
- جدول العمليات مع: refqa_id، اسم، هاتف، مبلغ، طريقة دفع، حالة، تاريخ، أزرار
- زر اعتماد ✅ / رفض ❌ مباشر من الصف
- DetailModal: كل التفاصيل + ملاحظات + اعتماد/رفض
- فلتر بحث + تاريخ من/إلى
- تصدير CSV
- **تبويب التقارير**: إجمالي محصّل، قيد التحصيل، معدل تحويل، متوسط تبرع + bar charts

### `AdminNotifications.tsx` ← جديد
- **Props**: `initialTab?: "telegram" | "whatsapp" | "twilio" | "email"`
- **تيليجرام**: Bot Token + Chat ID + 6 checkboxes للأحداث + زر اختبار
- **واتساب**: Access Token + Phone Number ID + API URL + نص رسالة الشكر قابل للتعديل + اختبار
- **Twilio**: Account SID + Auth Token + Sender ID + اختبار
- **البريد**: SMTP host/port/user/pass + from email/name + اختبار
- SecretInput: يخفي الـ tokens بـ password field مع زر إظهار/إخفاء

### `AdminSEO.tsx` ← جديد
- عنوان (max 60) + وصف (max 160) + كلمات مفتاحية
- Open Graph: صورة + URL
- Twitter Handle
- Google Analytics ID + Facebook Pixel ID
- Canonical URL + Robots meta
- Schema.org: نوع المنظمة + هاتف + إيميل + سنة التأسيس
- **معاينة حية** لـ Google / Facebook / Twitter في الوقت الفعلي
- **تقييم SEO**: 6 مؤشرات بصرية (✅/○)

### `AdminBackup.tsx` ← جديد
- إحصائيات البيانات (4 كاردات)
- تحميل JSON كامل (حملات + تبرعات + إعدادات)
- تحميل CSV للتبرعات (Excel-ready)
- تاريخ آخر نسخة (localStorage)
- جدولة تلقائية: يومي/أسبوعي/شهري + إيميل الاستقبال + تفعيل
- قسم الاستيراد (UI جاهز — logic قريباً)

### `AdminPayments.tsx` (بوابات الدفع اليدوي)
- 4 أنواع: محفظة، انستاباي، تحويل بنكي، فودافون كاش
- لكل بوابة: رقم الحساب، اسم الحساب، USSD code، رابط التحويل
- حفظ في Supabase settings key = "payment_methods"

### `AdminPaymentSettings.tsx` (بوابة الدفع الإلكترونية)
- إعداد Paymob: API Key، Integration ID (card+wallet)، Iframe ID (card+wallet)، HMAC Secret
- وضع تجريبي toggle
- تفعيل/إيقاف البوابة

### `AdminUsers.tsx`
- تبويبان: المستخدمون / أنواع الصلاحيات
- إنشاء/تعديل/تفعيل/إيقاف المستخدمين
- ربط أدوار بصلاحيات فردية

### `AdminBanners.tsx`
- إضافة/تعديل/حذف البانرات
- تحميل صور
- ترتيب drag-and-drop (order_index)
- تحديد تاريخ انتهاء

### `AdminAgents.tsx`
- إدارة المناديب الميدانيين
- اسم، هاتف، المنطقة، نشط/غير نشط

### `AdminFieldOrders.tsx`
- طلبات التحصيل المنزلي
- تعيين المندوب
- تتبع الحالة: pending → assigned → collected → confirmed

---

## 🔐 نظام المصادقة

- **Session-based**: express-session + SESSION_SECRET env var
- **bcryptjs** لـ hash كلمات المرور
- **Cookie**: `sameSite: "none", secure: true` في Replit (يكتشفه تلقائياً)
- الكشف عن Replit: `!!process.env.REPLIT_DOMAINS || !!process.env.REPL_ID`
- لا يوجد JWT — كل شيء session

---

## 🎯 خصائص مهمة جداً

### Refqa ID التسلسلي
```typescript
// في artifacts/api-server/src/routes/payments.ts
async function generateRefqaId(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // 20260329
  const prefix = `Refqa-${dateStr}-`;
  
  // يعد التبرعات بنفس prefix من Supabase
  const { count } = await supabase
    .from("donations")
    .select("*", { count: "exact", head: true })
    .like("refqa_id", `${prefix}%`);
  
  const seq = ((count ?? 0) + 1).toString().padStart(4, "0");
  return `${prefix}${seq}`; // Refqa-20260329-0001
}
```

### API Client في Frontend
```typescript
// artifacts/rafaqaa-website/src/lib/api-client.ts
const BASE = "/api"; // يمر عبر Replit proxy
// استخدام:
import api from "@/lib/api-client";
const data = await api.get<Type>("/endpoint");
await api.post("/endpoint", { data });
await api.patch("/endpoint/id", { field: value });
```

### Notifications Helpers (Backend)
```typescript
// يُستخدم في أي route من routes/notifications.ts exports
import { sendTelegramNotif, sendWhatsAppNotif, sendEmailNotif } from "./notifications.js";

// استخدام:
sendTelegramNotif("*عنوان*\nنص الرسالة").catch(() => {}); // silent fail
sendWhatsAppNotif("201xxxxxxxxx", "نص الرسالة").catch(() => {});
sendEmailNotif("email@domain.com", "الموضوع", "<html>...</html>").catch(() => {});
```

---

## 🌐 الـ GitHub Integration

المشروع مربوط بـ GitHub عبر Replit integration.
**للرفع على الريبو:**
```bash
git add -A
git commit -m "وصف التغييرات"
git push
```

---

## 📦 Dependencies المهمة

### Frontend
- `react` + `react-router-dom` — routing
- `framer-motion` — animations
- `@supabase/supabase-js` — Supabase client
- `lucide-react` — icons (استخدم دائماً من هنا)
- `tailwindcss` v4 — styling
- `react-hook-form` — forms
- `@radix-ui/*` — UI primitives (shadcn)
- `recharts` — رسوم بيانية

### Backend
- `express` v5 — web server
- `express-session` + `connect-pg-simple` — sessions
- `drizzle-orm` + `pg` — local DB
- `@supabase/supabase-js` — Supabase client
- `bcryptjs` — password hashing
- `multer` — file uploads
- `nodemailer` — إرسال إيميل
- `pino` — logging
- `esbuild` — bundling (no tsc type check at build time)

---

## 🎨 Design System

### الألوان (HSL tokens في globals.css)
```css
--primary: #10B981 (green — اللون الرئيسي)
--secondary: #D4AF37 (gold — اللون الثانوي)
--sidebar: bg-sidebar (dark sidebar)
--card: bg-card (cards background)
```

### الخطوط
```css
font-display: "Amiri" (العناوين الرئيسية)
font-body: "Tajawal" (النصوص العادية)
```

### قواعد التصميم
- كل شيء RTL (`dir="rtl"`)
- `rounded-xl` / `rounded-2xl` للكاردات
- `border border-border` للحدود
- `shadow-card` للظل
- Animation: `framer-motion` — دائماً `opacity: 0 → 1` عند الظهور
- `useToast()` من `@/hooks/use-toast` للرسائل

---

## ⚙️ Environment Variables

```bash
# متاحة دائماً في Replit:
DATABASE_URL          # Local PostgreSQL connection string
SESSION_SECRET        # Session encryption key (secret)
SUPABASE_URL          # Supabase project URL
SUPABASE_ANON_KEY     # Supabase anon key
REPLIT_DOMAINS        # للكشف عن بيئة Replit
REPL_ID               # معرف Replit
PORT                  # Port للـ Frontend (يتغير)
```

---

## 🚧 ما لم يُنفَّذ بعد (للـ AI القادم)

### 1. استيراد النسخ الاحتياطية
في `AdminBackup.tsx` — زر "اختر ملفاً" موجود لكن لا يوجد API endpoint.
**يحتاج**: `POST /api/backup/import` يقبل JSON ويُدخل البيانات في Supabase.

### 2. النسخ التلقائي الفعلي (Cron Job)
الجدولة محفوظة في DB لكن لا يوجد cron فعلي.
**يحتاج**: `node-cron` في الـ API server يتحقق من `backup_schedule` ويرسل الملف بإيميل.

### 3. بوابة المتبرع الشخصية
صفحة `/my-donations` — المتبرع يدخل رقم هاتفه ويرى سجل تبرعاته وأرقام Refqa.

### 4. إيصالات PDF
بعد اعتماد التبرع، توليد PDF بالإيصال + QR code يؤكد الصحة.
**مكتبة مقترحة**: `puppeteer` أو `jsPDF`.

### 5. تبرع دوري (Recurring)
نظام اشتراك في تبرع شهري ثابت.

### 6. بوابة المندوب الميداني (Mobile-first)
صفحة خاصة للمناديب بدون دخول للوحة الكاملة.
الرابط المقترح: `/agent-portal`

### 7. إشعارات Real-time في الـ Admin
WebSocket أو Server-Sent Events لإشعار الـ admin فوراً عند وصول تبرع جديد.

---

## 🐛 مشاكل معروفة (Pre-existing)

1. **`calendar.tsx` TypeScript error**: `IconLeft/IconRight` غير موجود في Radix — مش متعلق بكودنا، لا تُصلحه
2. **TypeScript type errors في API**: `adminUsersTable` وغيرها تبدو غير معرّفة في `tsc --noEmit` لكن esbuild يبني بنجاح — ignore
3. **Cookie في curl**: لا يعمل بسبب `SameSite=None` + `Secure` — يعمل عادي في المتصفح

---

## 📁 ملفات مهمة جداً — لا تحذفها

```
artifacts/api-server/src/routes/notifications.ts  ← helpers + routes للإشعارات
artifacts/api-server/src/routes/payments.ts        ← Refqa ID + Paymob + webhook
artifacts/api-server/src/routes/donations.ts       ← PATCH /status + auto-notify
artifacts/api-server/src/routes/backup.ts          ← export JSON/CSV
lib/db/src/schema/index.ts                         ← Drizzle schema الكامل
artifacts/rafaqaa-website/src/lib/api-client.ts    ← API helper
artifacts/rafaqaa-website/src/contexts/AuthContext.tsx ← auth state
```

---

## 💡 نصائح للـ AI القادم

1. **قبل أي تعديل**: اقرأ الملف المستهدف كاملاً
2. **عند إضافة route**: أضفه في `artifacts/api-server/src/routes/index.ts`
3. **عند إضافة مكون admin**: اربطه في `artifacts/rafaqaa-website/src/pages/Admin.tsx`
4. **الإشعارات**: استخدم دائماً `sendTelegramNotif().catch(()=>{})` — silent fail
5. **Supabase vs Local DB**:
   - بيانات المتبرعين والحملات → Supabase
   - الإدارة والإعدادات الحساسة (tokens) → Local PostgreSQL (Drizzle)
6. **لا تكسر**: نظام الـ refqa_id ← رقم رسمي للمؤسسة
7. **الـ cookie**: لا تعدّل `isReplit` check في `app.ts` — مهم لـ HTTPS
8. **بعد تعديل Backend**: أعد تشغيل `artifacts/api-server: API Server` workflow
9. **بعد DB schema change**: شغّل `pnpm --filter @workspace/db run push`
10. **اختبر دائماً**: `curl -s http://localhost:8080/api/YOUR_ROUTE`

---

## 📊 البنية التقنية للـ Monorepo

```yaml
# pnpm-workspace.yaml
packages:
  - "artifacts/*"
  - "lib/*"
```

```json
// tsconfig paths في كل artifact
{
  "@workspace/db": ["../../lib/db/src/index.ts"],
  "@workspace/db/schema": ["../../lib/db/src/schema/index.ts"]
}
```

**لتشغيل artifact محدد:**
```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/rafaqaa-website run dev
pnpm --filter @workspace/db run push
```

---

## 🚀 دليل النشر الكامل (Production Deployment)

> **مهم**: المشروع فيه Frontend (React) + Backend (Express) + قاعدتَي بيانات.
> Vercel وحده لا يكفي — يحتاج مكان للـ Backend.

---

### 📐 المعمارية الكاملة للإنتاج

```
المستخدمون
    ↓
Vercel (Frontend — مجاني)
    ↓  VITE_API_URL
Render أو Railway (Backend Express — ~$7/شهر أو مجاني)
    ├── Supabase       (تبرعات + حملات + إعدادات SEO)
    └── PostgreSQL     (مستخدمون + بانرات + مناديب + إشعارات)
```

---

### 🎯 الخيار الأول — Render.com + Vercel (موصى به)

#### الجزء A — Render (Backend)

**1. أنشئ حساب**
- روح [render.com](https://render.com) → سجّل بـ GitHub

**2. قاعدة البيانات أولاً**
- Dashboard → **New** → **PostgreSQL**
- Name: `rafaqaa-db`
- Region: **Frankfurt** (أقرب لمصر)
- Plan: **Free**
- اضغط **Create Database**
- انتظر دقيقتين ثم احتفظ بـ **External Database URL** (هيبدأ بـ `postgres://`)

**3. الـ Backend Service**
- Dashboard → **New** → **Web Service**
- ربط GitHub → اختار `RefqaV2`
- الإعدادات:
  ```
  Name:             rafaqaa-api
  Region:           Frankfurt
  Branch:           main
  Root Directory:   artifacts/api-server
  Build Command:    pnpm install && pnpm run build
  Start Command:    pnpm run start
  Plan:             Free (أو Starter $7)
  ```
- اضغط **Advanced** → **Add Environment Variables**:
  ```
  DATABASE_URL      = (External Database URL من الخطوة السابقة)
  SESSION_SECRET    = Rafaqaa@Prod#2026!SecureKey
  SUPABASE_URL      = (من Supabase → Settings → API)
  SUPABASE_ANON_KEY = (من Supabase → Settings → API)
  NODE_ENV          = production
  PORT              = 10000
  ```
- اضغط **Create Web Service** — انتظر 3-5 دقائق
- الرابط هيبقى: `https://rafaqaa-api.onrender.com` ← احتفظ بيه

**4. إنشاء جداول قاعدة البيانات (مرة واحدة فقط)**
- في Render Dashboard → الـ service بتاعك → **Shell**
- اكتب:
  ```bash
  cd /app && pnpm --filter @workspace/db run push
  ```
- هيقولك: `All migrations applied` — كده الجداول اتعملت

**5. مستخدم الـ Admin — يتعمل تلقائياً**
- ✅ لا تعمل حاجة — السيرفر بيشوف لو الجداول فاضية ويعمل المستخدم تلقائياً
- بيانات الدخول الأولى: **admin / admin123**
- **غيّر كلمة المرور فوراً** من لوحة التحكم → المستخدمين → تعديل
- هذا السلوك موجود في: `artifacts/api-server/src/routes/auth.ts` → `ensureDefaults()`

---

#### الجزء B — Vercel (Frontend)

**1. افتح مشروعك في Vercel**

**2. Settings → Environment Variables → أضف:**
```
VITE_API_URL = https://rafaqaa-api.onrender.com
```
*(الرابط بتاع Render بدون / في الآخر)*

**3. Deployments → الآخر deployment → Redeploy**

**4. Domain → نفس زي زمان**

**5. اختبر:**
- افتح الموقع → جرّب تبرع تجريبي
- `/admin` → admin / admin123 → غيّر الباسورد فوراً

---

### 🎯 الخيار الثاني — Railway + Vercel

#### الجزء A — Railway (Backend)

**1. روح [railway.app](https://railway.app) → New Project → Deploy from GitHub**

**2. اختار `RefqaV2`**
- بعد ما يظهر الـ project → اضغط على الـ service → **Settings**:
  ```
  Root Directory:   artifacts/api-server
  Build Command:    pnpm install && pnpm run build
  Start Command:    pnpm run start
  ```

**3. أضف PostgreSQL**
- في الـ project → **+ New** → **Database** → **Add PostgreSQL**
- Railway هيضيف `DATABASE_URL` تلقائياً في Variables

**4. Variables → أضف:**
```
SESSION_SECRET    = Rafaqaa@Prod#2026!SecureKey
SUPABASE_URL      = (من Supabase)
SUPABASE_ANON_KEY = (من Supabase)
NODE_ENV          = production
```

**5. Settings → Networking → Generate Domain**
- هيديك رابط زي `https://refqav2-production.up.railway.app`

**6. إنشاء الجداول — Railway Shell:**
```bash
pnpm --filter @workspace/db run push
```

**7. باقي الخطوات نفس Vercel زي الخيار الأول**

---

### 🎯 الخيار الثالث — Replit Deploy (الأسهل)

لو عايز كل حاجة في مكان واحد بدون تعقيد:

**1. في Replit → اضغط زرار Deploy (أعلى يمين)**

**2. اختار Autoscale أو Reserved VM**

**3. Environment Variables (في Replit Secrets):**
```
SESSION_SECRET    = Rafaqaa@Prod#2026!SecureKey
SUPABASE_URL      = (موجود بالفعل)
SUPABASE_ANON_KEY = (موجود بالفعل)
```

**4. Domain → في Replit Deployments → Custom Domain**

**السعر**: $7-12/شهر حسب الـ plan

---

### 🔧 إعدادات Paymob للدفع الحقيقي

بعد ما الموقع اشتغل، عشان تفعّل الدفع الإلكتروني الحقيقي:

**1. سجّل في [paymob.com](https://paymob.com)**

**2. من Dashboard احتفظ بـ:**
- API Key
- Integration ID (Card)
- Integration ID (Wallet) — اختياري
- Iframe ID
- HMAC Secret

**3. في لوحة التحكم → بوابة الدفع الإلكتروني → إعدادات البوابة**
- أدخل كل البيانات دي
- وقّف وضع تجريبي ← يفعّل الدفع الحقيقي

**4. في Paymob Dashboard → Webhooks:**
```
https://rafaqaa-api.onrender.com/api/payments/paymob/callback
```

---

### ✅ قائمة التحقق قبل الإطلاق

```
□ Backend شغّال والـ URL يرد على /api/stats
□ Frontend يتصل بالـ Backend (VITE_API_URL صح)
□ تسجيل دخول admin يشتغل
□ إنشاء تبرع تجريبي ينجح
□ تأكيد الدفع التجريبي يشتغل
□ الإشعارات (Telegram على الأقل) تشتغل
□ كلمة مرور admin اتغيّرت من admin123
□ Domain مربوط وـ SSL شغّال
□ Paymob Webhook URL متسجّل (للدفع الحقيقي)
```

---

### 🆘 مشاكل شائعة وحلولها

| المشكلة | السبب | الحل |
|---|---|---|
| `EUNSUPPORTEDPROTOCOL catalog:` | npm بدل pnpm | تأكد `packageManager` موجود في `package.json` |
| `PORT not provided` | بيئة الإنتاج | أضف `PORT=10000` في Environment Variables |
| Login يشتغل بس يطلع 401 فوراً | Cookie SameSite | `NODE_ENV=production` لازم يكون متضبط |
| الـ Frontend مش بيتصل بالـ Backend | VITE_API_URL غلط | تأكد من الرابط بدون `/` في الآخر |
| الجداول مش موجودة | لم يُشغَّل push | شغّل `pnpm --filter @workspace/db run push` |
| قاعدة البيانات فاضية | أول تشغيل | أدخل بيانات المستخدمين يدوياً أو بـ seed script |

---

*آخر تحديث: 30 مارس 2026*
*المشروع: رفقاء البررة — نظام إدارة الجمعيات الخيرية*
