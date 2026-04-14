# دليل النشر على Vercel — رفقاء البررة
## Rafaqaa Al-Barrara — Vercel Serverless Deployment Guide

---

## المعمارية (Architecture)

```
GitHub Repository
      │
      ▼
┌─────────────────────────────┐
│         VERCEL              │
│                             │
│  ┌─────────────────────┐   │
│  │  Frontend (React)   │   │  ← artifacts/rafaqaa-website
│  │  Static Site (CDN)  │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  API Serverless     │   │  ← api/index.ts → Express app
│  │  /api/*  requests   │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
      │              │
      ▼              ▼
┌──────────┐   ┌──────────────┐
│ Supabase │   │  PostgreSQL  │
│(Donations│   │ (Admin DB +  │
│Campaigns)│   │  Sessions)   │
└──────────┘   └──────────────┘
```

> ✅ **لا يوجد Render. لا يوجد Railway. كل حاجة على Vercel.**

---

## المتطلبات المسبقة

قبل النشر، لازم تجهّز:

1. **حساب GitHub** — لرفع الكود
2. **حساب Vercel** — مجاني على https://vercel.com
3. **حساب Supabase** — مجاني على https://supabase.com
4. **قاعدة بيانات PostgreSQL** — لإدارة الأدمن والجلسات:
   - **Vercel Postgres** (مجاني — الأسهل مع Vercel)
   - أو **Neon** (مجاني — https://neon.tech)
   - أو **Railway PostgreSQL** (5$/شهر)

---

## الخطوة 1 — Supabase

### 1.1 إنشاء المشروع
1. اذهب لـ https://supabase.com → New Project
2. احفظ: Project URL + anon key + service_role key

### 1.2 إنشاء الجداول
في Supabase → SQL Editor، شغّل هذا الكود:

```sql
-- التبرعات
create table if not exists donations (
  id uuid default gen_random_uuid() primary key,
  refqa_id text unique,
  donor_name text not null,
  donor_phone text,
  donor_email text,
  amount numeric not null,
  campaign_id text,
  campaign_title text,
  method text default 'bank',
  status text default 'pending',
  created_at timestamptz default now(),
  confirmed_at timestamptz,
  paymob_order_id text,
  gateway_transaction_id text,
  notes text,
  agent_id integer
);

-- الحملات
create table if not exists campaigns (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  goal_amount numeric default 0,
  raised_amount numeric default 0,
  image_url text,
  is_active boolean default true,
  is_featured boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- الإعدادات
create table if not exists settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- البانرات
create table if not exists banners (
  id uuid default gen_random_uuid() primary key,
  content text,
  type text default 'info',
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- قصص النجاح
create table if not exists success_stories (
  id uuid default gen_random_uuid() primary key,
  title text,
  content text,
  image_url text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security
alter table donations enable row level security;
alter table campaigns enable row level security;
alter table settings enable row level security;
alter table banners enable row level security;

create policy "service_all" on donations for all using (true);
create policy "service_all" on campaigns for all using (true);
create policy "service_all" on settings for all using (true);
create policy "service_all" on banners for all using (true);
create policy "public_read" on campaigns for select using (true);
create policy "public_read" on settings for select using (true);
create policy "public_read" on banners for select using (true);
```

---

## الخطوة 2 — رفع الكود على GitHub

```bash
git add -A
git commit -m "Deploy: Vercel Serverless Functions setup"
git push origin main
```

---

## الخطوة 3 — إنشاء مشروع Vercel

1. اذهب لـ https://vercel.com → **Add New Project**
2. **Import** من GitHub — اختر المستودع
3. لا تغيّر أي إعدادات — Vercel سيكتشف `vercel.json` تلقائياً

### إعدادات الـ Build (تلقائية من vercel.json):
- **Framework**: Other
- **Install Command**: `pnpm install`
- **Build Command**: `pnpm --filter @workspace/rafaqaa-website run build`
- **Output Directory**: `artifacts/rafaqaa-website/dist/public`

---

## الخطوة 4 — متغيرات البيئة في Vercel

في مشروع Vercel → **Settings → Environment Variables**، أضف كل دي:

### مطلوبة (الموقع لن يعمل بدونها):

```
DATABASE_URL          = postgresql://user:pass@host:5432/db?sslmode=require
SUPABASE_URL          = https://xxxxxx.supabase.co
SUPABASE_ANON_KEY     = eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
SESSION_SECRET        = [نص عشوائي طويل مثل: Rafaqaa@SecureSession!2025#xyz]
NODE_ENV              = production
```

### إنشاء SESSION_SECRET:
افتح أي موقع مثل https://randomkeygen.com أو نفّذ:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### اختيارية (للدفع الإلكتروني):
```
PAYMOB_API_KEY        = 
PAYMOB_INTEGRATION_ID = 
PAYMOB_IFRAME_ID      = 
PAYMOB_HMAC_SECRET    = 
```

### اختيارية (للإشعارات):
```
TELEGRAM_BOT_TOKEN    = 
TELEGRAM_CHAT_ID      = 
WHATSAPP_TOKEN        = 
WHATSAPP_PHONE_ID     = 
```

### ربط الفرونت بالباك (مهم!):
```
VITE_API_URL          = [اتركه فارغ — لأن الـ API في نفس Vercel مشروع]
```

---

## الخطوة 5 — تشغيل جداول الأدمن

بعد أول deploy، هتحتاج تشغيل أمر واحد يعمل جداول الأدمن ويسيد الحسابات.

**الطريقة:** من terminal في جهازك:

```bash
# ثبّت اول
pnpm install

# ابعت DATABASE_URL وشغّل db:push
DATABASE_URL="postgresql://..." pnpm --filter @workspace/api-server run db:push
```

ده هيعمل جداول:
- `admin_users` (حسابات الأدمن)
- `sessions` → `user_sessions` (الجلسات)  
- `payment_settings` (إعدادات Paymob)
- `agents` (المناديب)
- `field_orders` (الطلبات)
- `audit_logs` (سجل العمليات)
- `banners` (البانرات)

**وهيعمل حسابات الأدمن تلقائياً:**
| username | password | role |
|---|---|---|
| `admin` | `admin123` | admin |
| `supervisor` | `Rafaqaa@Sup2025` | moderator |

> **غيّرهم فور الدخول!**

---

## الخطوة 6 — إعداد Paymob Webhook

في Paymob Dashboard → **Settings → Webhook URL**:

```
https://your-site.vercel.app/api/payments/paymob/callback
```

**Transaction Processed Event**: فعّله ✅

---

## الخطوة 7 — اختبار كل حاجة

```bash
# اختبر الـ API
curl https://your-site.vercel.app/api/health

# اختبر الحملات
curl https://your-site.vercel.app/api/campaigns

# اختبر تسجيل الدخول
curl -X POST https://your-site.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## هيكل الملفات المهم لـ Vercel

```
/ (project root)
├── vercel.json           ← إعداد Vercel الرئيسي
├── api/
│   └── index.ts          ← Serverless Function (Express handler)
├── artifacts/
│   ├── rafaqaa-website/  ← Frontend React
│   │   ├── src/
│   │   └── dist/public/  ← Static output (Vercel serves this)
│   └── api-server/
│       └── src/
│           ├── app.ts    ← Express app (مستورد في api/index.ts)
│           └── routes/   ← كل الـ routes
```

---

## مشاكل شائعة وحلولها

### ❌ "Function timeout"
- زود الـ `maxDuration` في `vercel.json` (max 60s على Hobby)
- أو upgrade لـ Pro

### ❌ "Session not persisting"
- تأكد من إضافة `DATABASE_URL` في Environment Variables
- الجلسات بتتحفظ في PostgreSQL تلقائياً

### ❌ "CORS error"
- في Vercel Dashboard، تأكد أن `FRONTEND_URL` غير موجود (أو يساوي domain الموقع)

### ❌ "Database connection failed"
- تأكد من `?sslmode=require` في نهاية `DATABASE_URL`
- جرب من Vercel Dashboard → Functions → Logs

### ❌ Admin لا يعمل
- شغّل `db:push` لإنشاء الجداول
- تأكد من `SESSION_SECRET` في Environment Variables

---

## Vercel CLI (اختياري)

```bash
# تثبيت Vercel CLI
npm i -g vercel

# login
vercel login

# deploy من terminal
vercel --prod
```

---

*آخر تحديث: أبريل 2025 — مؤسسة رفقاء البررة*
