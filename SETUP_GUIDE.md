# دليل الإعداد الكامل — رفقاء البررة

> موقع التبرع الرسمي لمؤسسة رفقاء البررة للتنمية والخدمات الدينية والاجتماعية  
> مرخصة من وزارة التضامن — إشهار رقم 7932 — جيزة

---

## المتطلبات الأساسية

| الأداة | الإصدار |
|--------|---------|
| Node.js | 20+ |
| pnpm | 9+ |
| Git | أي إصدار |
| حساب Supabase | مجاني |
| حساب Render.com أو Railway | مجاني |
| حساب Vercel | مجاني |

---

## الخطوة 1 — تجهيز قاعدة البيانات (Supabase)

### إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com) → **New Project**
2. احتفظ بـ:
   - `Project URL` (مثال: `https://abcd.supabase.co`)
   - `anon public key`
   - `service_role key`

### إنشاء جداول Supabase (انسخ وشغّل في SQL Editor)

```sql
-- ===== جداول Supabase =====

-- حملات التبرع
create table if not exists campaigns (
  id bigserial primary key,
  title text not null,
  description text,
  goal_amount numeric default 0,
  raised_amount numeric default 0,
  image_url text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- التبرعات
create table if not exists donations (
  id bigserial primary key,
  refqa_id text unique,
  donor_name text not null,
  donor_phone text not null,
  donor_email text,
  campaign_id bigint,
  campaign_title text,
  amount numeric not null,
  payment_method text,
  operation_id text,
  receipt_image_url text,
  status text default 'pending',
  user_id text,
  note text,
  notes text,
  agent_id bigint,
  confirmed_at timestamptz,
  created_at timestamptz default now()
);

-- الإعدادات
create table if not exists settings (
  id bigserial primary key,
  key text unique not null,
  value jsonb,
  updated_at timestamptz default now()
);

-- طرق الدفع
create table if not exists payment_methods (
  id bigserial primary key,
  method text not null,
  type text,
  account_number text,
  account_name text,
  ussd_code text,
  transfer_link text,
  active boolean default true,
  sort_order int default 0
);

-- قصص النجاح
create table if not exists success_stories (
  id bigserial primary key,
  title text not null,
  content text,
  image_url text,
  published boolean default false,
  created_at timestamptz default now()
);

-- SEO
create table if not exists seo_settings (
  id bigserial primary key,
  page text unique not null,
  title text,
  description text,
  keywords text,
  og_image text,
  updated_at timestamptz default now()
);

-- الإعدادات الافتراضية
insert into settings (key, value) values
  ('general', '{"org_name":"رفقاء البررة","org_tagline":"معاً نبني مستقبلاً أفضل","contact_phone":"01000000000","contact_email":"info@rafqa.org"}'),
  ('feature_flags', '{"api_payments":false,"manual_payments":true,"home_delivery":true,"agent_donations":true,"site_disabled":false,"site_disabled_message":"الموقع تحت الصيانة، يرجى المحاولة لاحقاً"}'),
  ('social_links', '{"facebook":"","instagram":"","twitter":"","youtube":"","whatsapp":"","telegram":""}'),
  ('whatsapp_template', '{"template":"مرحباً، أود التبرع بمبلغ {{amount}} جنيه لحملة {{campaign}}. اسمي {{name}} ورقمي {{phone}}"}')
on conflict (key) do nothing;
```

---

## الخطوة 2 — إعداد قاعدة بيانات PostgreSQL (للجلسات والمستخدمين)

> يمكن استخدام **Supabase نفسه** بـ Connection String أو **Neon.tech** (مجاني)

### الجداول المحلية (Drizzle ORM — تُنشأ تلقائياً)

```sql
-- المستخدمون الإداريون
-- sessions (جلسات تسجيل الدخول)
-- banners (البانرات)
-- agents (المناديب)
-- audit_logs (سجل العمليات)
-- notification_settings (إعدادات الإشعارات)
-- field_orders (الطلبات الميدانية)
-- permission_types (أنواع الصلاحيات)
```

تُنشأ تلقائياً عند تشغيل:
```bash
pnpm --filter @workspace/db run push
```

---

## الخطوة 3 — متغيرات البيئة

### ملف `artifacts/api-server/.env`

```env
# ===== Supabase =====
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # اختياري للعمليات الحساسة

# ===== PostgreSQL (للجلسات والمستخدمين) =====
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# ===== الجلسة =====
SESSION_SECRET=اكتب-هنا-أي-نص-طويل-عشوائي-لا-يقل-عن-32-حرف

# ===== البيئة =====
NODE_ENV=production
PORT=8080

# ===== Paymob (اختياري) =====
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_HMAC_SECRET=

# ===== إشعارات (اختيارية) =====
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### ملف `artifacts/rafaqaa-website/.env` (أو في Vercel Dashboard)

```env
VITE_API_URL=https://your-api.onrender.com
```

---

## الخطوة 4 — التشغيل المحلي (Development)

```bash
# 1. استنساخ المشروع
git clone https://github.com/DrGohar1/RefqaV1.git
cd RefqaV1

# 2. تثبيت المكتبات
npm install -g pnpm
pnpm install

# 3. إنشاء ملف .env (انسخ من الخطوة 3)
cp artifacts/api-server/.env.example artifacts/api-server/.env
# عدّل القيم

# 4. مزامنة قاعدة البيانات
pnpm --filter @workspace/db run push

# 5. تشغيل الخادم
pnpm --filter @workspace/api-server run dev
# في نافذة أخرى:
pnpm --filter @workspace/rafaqaa-website run dev
```

- الموقع: http://localhost:5173
- API: http://localhost:8080
- لوحة التحكم: http://localhost:5173/admin

---

## الخطوة 5 — النشر على الإنترنت (Render + Vercel)

### 5.1 — نشر الـ API على Render.com

1. اذهب إلى [render.com](https://render.com) → **New Web Service**
2. اختر **Connect from GitHub** واختر الريبو
3. أدخل الإعدادات:

| الحقل | القيمة |
|-------|--------|
| **Build Command** | `npm install -g pnpm && pnpm install && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node artifacts/api-server/dist/index.mjs` |
| **Instance Type** | Free |

4. أضف متغيرات البيئة من الخطوة 3

### 5.2 — نشر الواجهة على Vercel

1. اذهب إلى [vercel.com](https://vercel.com) → **Add New Project**
2. اختر الريبو من GitHub
3. أدخل الإعدادات:

| الحقل | القيمة |
|-------|--------|
| **Framework Preset** | Vite |
| **Root Directory** | `artifacts/rafaqaa-website` |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `dist` |

4. أضف متغير البيئة:
   - `VITE_API_URL` = رابط خدمة Render (مثال: `https://rafaqaa-api.onrender.com`)

---

## الخطوة 6 — بديل: النشر على Railway (الكل في مكان واحد)

```bash
# تثبيت Railway CLI
npm install -g @railway/cli

# تسجيل دخول
railway login

# نشر
railway up
```

أو من [railway.app](https://railway.app):
- New Project → Deploy from GitHub → اختر الريبو

---

## الخطوة 7 — إعداد Paymob (الدفع الأونلاين)

1. إنشاء حساب على [paymob.com](https://paymob.com)
2. من Dashboard → **API Key** → انسخه
3. إنشاء Integration:
   - **Accept** → Integrations → New Integration
   - اختر **Card Payments**
   - احتفظ بـ **Integration ID**
4. تسجيل Webhook:
   ```
   https://your-api.onrender.com/api/payments/webhook
   ```
5. في لوحة التحكم → **إعدادات بوابة الدفع** → أدخل البيانات

---

## الخطوة 8 — إعداد لوحة التحكم

### بيانات الدخول الافتراضية

| المستخدم | كلمة المرور | الصلاحية |
|----------|------------|----------|
| `admin` | `admin123` | مدير كامل |
| `supervisor` | `Rafaqaa@Sup2025` | مشرف |

> **تحذير:** غيّر كلمات المرور فوراً من لوحة التحكم → المستخدمون

### أقسام لوحة التحكم

| القسم | الوصف |
|-------|-------|
| **التبرعات** | عرض، تأكيد، تعديل، حذف |
| **الحملات** | إنشاء حملات وتحديد الأهداف |
| **المناديب** | متابعة الأداء والطلبات الميدانية |
| **الإعدادات** | بيانات المؤسسة + سوشيال + واتساب |
| **Feature Flags** | تفعيل/تعطيل المميزات |
| **Kill Switch** | إيقاف الموقع كاملاً عند الصيانة |
| **المستخدمون** | إدارة كلمات المرور والصلاحيات |
| **سجل العمليات** | تاريخ كل العمليات |
| **الإشعارات** | إعدادات واتساب وتيليجرام |
| **البانرات** | بانرات الإعلانات والمعلومات |

---

## الخطوة 9 — Feature Flags (تفعيل/تعطيل المميزات)

من لوحة التحكم → **الإعدادات** → **الميزات والصيانة**:

| الميزة | الوصف |
|--------|-------|
| `site_disabled` | إيقاف الموقع كاملاً (صفحة صيانة) |
| `api_payments` | تفعيل الدفع الأونلاين عبر Paymob |
| `manual_payments` | تفعيل الدفع اليدوي (تحويل/محفظة) |
| `home_delivery` | تفعيل التحصيل عن طريق منادي |
| `agent_donations` | تفعيل تبرعات المناديب |

---

## الخطوة 10 — إعداد الإشعارات

### واتساب
1. من الإعدادات → تبويب **واتساب**
2. أدخل رقم الواتساب بالصيغة: `201XXXXXXXXX`
3. خصص رسالة الإشعار باستخدام المتغيرات:
   - `{{name}}` — اسم المتبرع
   - `{{amount}}` — المبلغ
   - `{{campaign}}` — اسم الحملة
   - `{{phone}}` — رقم الهاتف
   - `{{refqa_id}}` — رقم العملية

### تيليجرام
1. أنشئ Bot من [@BotFather](https://t.me/BotFather)
2. احتفظ بـ `BOT_TOKEN`
3. احصل على `CHAT_ID` من [@userinfobot](https://t.me/userinfobot)
4. أضفهم في متغيرات البيئة

---

## الخطوة 11 — نظام المناديب

### إنشاء منادي
1. لوحة التحكم → **المناديب** → **إضافة منادي**
2. أدخل: الاسم، الهاتف، المنطقة، الهدف الشهري

### متابعة الأداء
- **قائمة المناديب**: إجمالي التحصيل لكل منادي
- **الطلبات الميدانية**: الطلبات المحالة لكل منادي
- **تقارير الأداء**: ترتيب حسب التحصيل مع progress bars

---

## هيكل المشروع

```
RefqaV1/
├── artifacts/
│   ├── rafaqaa-website/          # الواجهة (React + Vite)
│   │   └── src/
│   │       ├── components/       # مكونات الواجهة
│   │       │   ├── admin/        # لوحة التحكم (17 مكون)
│   │       │   └── ui/           # مكونات shadcn/ui
│   │       ├── contexts/         # Auth, FeatureFlags, Basket
│   │       ├── pages/            # Index, Admin, Track, Install
│   │       └── lib/              # api.ts, utils.ts
│   └── api-server/               # الخادم (Express.js)
│       └── src/
│           ├── routes/           # 16 مسار API
│           └── lib/              # supabase, logger
├── api/                          # Vercel Serverless Functions
├── lib/                          # مكتبات مشتركة
│   ├── api-client-react/
│   ├── api-spec/
│   └── db/                       # Drizzle ORM Schema
├── vercel.json                   # إعداد Vercel
└── pnpm-workspace.yaml
```

---

## مسارات API الرئيسية

| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/api/health` | فحص حالة الخادم |
| POST | `/api/auth/login` | تسجيل الدخول |
| POST | `/api/auth/logout` | تسجيل الخروج |
| GET | `/api/donations` | كل التبرعات (admin) |
| POST | `/api/donations` | إنشاء تبرع |
| GET | `/api/donations/track` | تتبع تبرع (`?phone=&refqa_id=`) |
| PATCH | `/api/donations/:id/status` | تغيير حالة تبرع |
| GET | `/api/campaigns` | كل الحملات |
| POST | `/api/campaigns` | إنشاء حملة |
| GET | `/api/settings/:key` | قراءة إعداد |
| PUT | `/api/settings/:key` | تحديث إعداد |
| GET | `/api/agents` | قائمة المناديب |
| GET | `/api/agents/:id/orders` | طلبات منادي |
| PATCH | `/api/agents/:id/collected` | تحديث التحصيل |
| POST | `/api/payments/initiate` | بدء دفع Paymob |
| POST | `/api/payments/webhook` | webhook Paymob |

---

## حل المشكلات الشائعة

### مشكلة: لا أستطيع تسجيل الدخول
- تأكد أن `DATABASE_URL` صحيح
- تأكد أن `SESSION_SECRET` موجود
- شغّل `pnpm --filter @workspace/db run push` لإنشاء الجداول

### مشكلة: التبرعات لا تظهر
- تأكد أن `SUPABASE_URL` و `SUPABASE_ANON_KEY` صحيحان
- تأكد من إنشاء جداول Supabase من الخطوة 1

### مشكلة: الموقع لا يتواصل مع API
- تأكد أن `VITE_API_URL` يشير لرابط API الصحيح
- تأكد أن CORS مفعّل (مفعّل تلقائياً في development)

### مشكلة: الدفع الأونلاين لا يعمل
- فعّل `api_payments` من Feature Flags
- تأكد من متغيرات Paymob في .env
- تأكد من تسجيل Webhook URL

---

## روابط مفيدة

- [Supabase](https://supabase.com) — قاعدة البيانات
- [Render.com](https://render.com) — استضافة API
- [Vercel](https://vercel.com) — استضافة الواجهة
- [Railway](https://railway.app) — استضافة بديلة
- [Paymob](https://paymob.com) — بوابة الدفع
- [Neon.tech](https://neon.tech) — PostgreSQL مجاني

---

## الترخيص

MIT License — يمكن الاستخدام التجاري والتعديل والتوزيع  
© 2025 رفقاء البررة — جميع الحقوق محفوظة
