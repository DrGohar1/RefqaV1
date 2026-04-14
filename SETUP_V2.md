# 🚀 دليل الإعداد الكامل — رفقاء البررة v2

## المتطلبات

- Node.js 20+
- pnpm 9+
- حساب Supabase (مجاني)
- حساب Neon أو Supabase PostgreSQL للـ sessions

---

## الإعداد المحلي (Development)

### 1. تثبيت المكتبات

```bash
pnpm install
```

### 2. إعداد متغيرات البيئة

أنشئ ملف `.env` في `artifacts/api-server/`:

```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...

# PostgreSQL (للـ sessions والمستخدمين)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Session
SESSION_SECRET=any-long-random-string-here

# Paymob (اختياري)
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_HMAC_SECRET=

# إشعارات (اختيارية)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### 3. إعداد قاعدة البيانات

```bash
pnpm --filter @workspace/db run push
```

### 4. تشغيل المشروع

```bash
# في نافذة 1
pnpm --filter @workspace/api-server run dev

# في نافذة 2
pnpm --filter @workspace/rafaqaa-website run dev
```

الموقع: http://localhost:5173  
API: http://localhost:8080

---

## إعداد Supabase

### جداول مطلوبة في Supabase

```sql
-- حملات التبرع
create table campaigns (
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
create table donations (
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
  confirmed_at timestamptz,
  created_at timestamptz default now()
);

-- الإعدادات
create table settings (
  id bigserial primary key,
  key text unique not null,
  value jsonb,
  updated_at timestamptz default now()
);

-- طرق الدفع
create table payment_methods (
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
```

---

## النشر على Render + Vercel (موصى به)

### الخادم (Render.com)

1. **New Web Service** → Connect GitHub repo
2. **Build Command**: `npm install -g pnpm && pnpm install && pnpm --filter @workspace/api-server run build`
3. **Start Command**: `node artifacts/api-server/dist/index.mjs`
4. **Environment Variables**:
   - `DATABASE_URL` = رابط PostgreSQL
   - `SUPABASE_URL` = رابط Supabase
   - `SUPABASE_ANON_KEY` = مفتاح Supabase
   - `SESSION_SECRET` = أي string طويل عشوائي
   - `NODE_ENV` = production

### الواجهة (Vercel)

1. **Import Project** من GitHub
2. **Framework**: Vite
3. **Root Directory**: `artifacts/rafaqaa-website`
4. **Build Command**: `pnpm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**:
   - `VITE_API_URL` = رابط Render (مثل: https://rafaqaa-api.onrender.com)

---

## النشر على Railway (بديل)

```bash
# API
railway up --service api-server

# Frontend
railway up --service rafaqaa-website
```

---

## إعداد Paymob

1. إنشاء حساب على https://paymob.com
2. من Dashboard → Get API Key
3. إنشاء Integration للـ Card Payments
4. تسجيل Webhook URL:
   ```
   https://your-api.onrender.com/api/payments/webhook
   ```
5. إدخال البيانات في لوحة التحكم → إعدادات بوابة الدفع

---

## إعداد Social Links

1. سجّل دخولك على لوحة التحكم `/admin`
2. من قسم **الإعدادات** → تبويب **سوشيال**
3. أدخل روابط منصات التواصل الاجتماعي
4. من تبويب **واتساب** أدخل رقم الواتساب ونص الرسالة الافتراضية
5. اضغط **حفظ** — تظهر فوراً في الموقع

---

## بيانات الدخول الافتراضية

| المستخدم | كلمة المرور |
|----------|------------|
| admin | admin123 |
| supervisor | Rafaqaa@Sup2025 |

> ⚠️ غيّر كلمات المرور فوراً بعد أول تسجيل دخول!

---

## روابط مفيدة

- [Supabase Dashboard](https://supabase.com)
- [Render.com](https://render.com)
- [Vercel](https://vercel.com)
- [Paymob](https://paymob.com)
