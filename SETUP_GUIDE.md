# دليل الإعداد الكامل — رفقاء البررة
  ## Vercel + Supabase فقط

  > موقع التبرع الرسمي لمؤسسة رفقاء البررة  
  > إشهار رقم 7932 — وزارة التضامن الاجتماعي — جيزة

  ---

  ## نظرة عامة على المعمارية

  ```
  GitHub (RefqaV1)
        │
        ▼
  ┌──────────────────────────────────┐
  │              VERCEL              │
  │                                  │
  │  Frontend (React/Vite)  →  CDN  │
  │  +                               │
  │  API Serverless Functions        │
  │  (api/index.ts → Express)        │
  │                                  │
  │  ┌──────────────────────────┐    │
  │  │  Vercel Postgres (DB)    │    │
  │  │  Admin + Sessions        │    │
  │  └──────────────────────────┘    │
  └──────────────────────────────────┘
                │
                ▼
         ┌────────────┐
         │  Supabase  │
         │ Donations  │
         │ Campaigns  │
         └────────────┘
  ```

  > ✅ كل حاجة جوه Vercel — بدون Neon، بدون Render، بدون Railway.

  ---

  ## المتطلبات

  | الحساب | الرابط | المجاني يكفي؟ |
  |--------|--------|--------------|
  | GitHub | github.com | ✅ |
  | Vercel | vercel.com | ✅ (Hobby) |
  | Supabase | supabase.com | ✅ |

  ---

  ## الخطوة 1 — إعداد Supabase

  ### 1.1 أنشئ مشروع جديد
  1. اذهب لـ [supabase.com](https://supabase.com) → **New Project**
  2. احتفظ بـ:
     - **Project URL** (مثال: `https://abcdef.supabase.co`)
     - **anon public key**
     - **service_role key** (من Settings → API)

  ### 1.2 أنشئ الجداول — انسخ وشغّل في SQL Editor

  ```sql
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

  -- الحملات
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

  -- RLS Policies
  alter table donations enable row level security;
  alter table campaigns enable row level security;
  alter table settings enable row level security;
  alter table payment_methods enable row level security;
  alter table success_stories enable row level security;

  create policy "allow_all" on donations for all using (true) with check (true);
  create policy "allow_all" on campaigns for all using (true) with check (true);
  create policy "allow_all" on settings for all using (true) with check (true);
  create policy "allow_all" on payment_methods for all using (true) with check (true);
  create policy "allow_all" on success_stories for all using (true) with check (true);

  -- بيانات افتراضية
  insert into settings (key, value) values
    ('general', '{"org_name":"رفقاء البررة","org_tagline":"معاً نبني مستقبلاً أفضل","contact_phone":"01000000000","contact_email":"info@rafqa.org"}'),
    ('feature_flags', '{"api_payments":false,"manual_payments":true,"home_delivery":true,"agent_donations":true,"site_disabled":false,"site_disabled_message":"الموقع تحت الصيانة، يرجى المحاولة لاحقاً"}'),
    ('social_links', '{"facebook":"","instagram":"","twitter":"","youtube":"","whatsapp":"","telegram":""}'),
    ('whatsapp_template', '{"template":"مرحباً، أود التبرع بمبلغ {{amount}} جنيه لحملة {{campaign}}"}')
  on conflict (key) do nothing;
  ```

  ---

  ## الخطوة 2 — إنشاء مشروع Vercel

  1. اذهب لـ [vercel.com](https://vercel.com) → **Add New Project**
  2. اختر **Import Git Repository** → اختر **RefqaV1**
  3. Vercel هيكتشف `vercel.json` تلقائياً ❗ **لا تغيّر أي إعدادات Build**

  ---

  ## الخطوة 3 — إضافة Vercel Postgres (بديل Neon)

  > Vercel Postgres هو قاعدة بيانات PostgreSQL مدمجة في Vercel — بيضيف `DATABASE_URL` تلقائياً لمشروعك.

  ### 3.1 إنشاء قاعدة البيانات
  1. في Vercel Dashboard → اختر مشروعك
  2. اضغط تبويب **Storage**
  3. اضغط **Create Database** → اختر **Postgres**
  4. اختر اسم (مثل: `rafqa-db`) → اختر المنطقة الأقرب → **Create**

  ### 3.2 ربطها بالمشروع
  1. بعد الإنشاء → اضغط **Connect to Project**
  2. اختر مشروعك → **Connect**
  3. ✅ Vercel هيضيف هذه المتغيرات تلقائياً:
     - `DATABASE_URL`
     - `POSTGRES_URL`
     - `POSTGRES_HOST`
     - `POSTGRES_USER`
     - وغيرها

  ---

  ## الخطوة 4 — متغيرات البيئة في Vercel

  **Settings → Environment Variables → Add:**

  ### مطلوبة

  | الاسم | القيمة |
  |-------|--------|
  | `DATABASE_URL` | ✅ **تلقائي من Vercel Postgres** |
  | `SUPABASE_URL` | رابط Supabase |
  | `SUPABASE_ANON_KEY` | anon key |
  | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
  | `SESSION_SECRET` | نص عشوائي طويل (32+ حرف) |
  | `NODE_ENV` | `production` |
  | `VITE_API_URL` | **اتركه فارغاً** |

  ### إنشاء SESSION_SECRET:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

  ### اختيارية — Paymob

  | الاسم | القيمة |
  |-------|--------|
  | `PAYMOB_API_KEY` | من Paymob Dashboard |
  | `PAYMOB_INTEGRATION_ID` | رقم الـ Integration |
  | `PAYMOB_HMAC_SECRET` | من Paymob Settings |

  ### اختيارية — الإشعارات

  | الاسم | القيمة |
  |-------|--------|
  | `TELEGRAM_BOT_TOKEN` | من @BotFather |
  | `TELEGRAM_CHAT_ID` | من @userinfobot |

  ---

  ## الخطوة 5 — أول Deploy وإنشاء جداول الأدمن

  ### 5.1 اضغط Deploy في Vercel

  انتظر حتى يكتمل الـ Build.

  ### 5.2 إنشاء جداول الأدمن (مرة واحدة فقط)

  بعد الـ Deploy من جهازك:

  ```bash
  git clone https://github.com/DrGohar1/RefqaV1.git
  cd RefqaV1
  npm install -g pnpm
  pnpm install
  DATABASE_URL="postgresql://..." pnpm --filter @workspace/db run push
  ```

  > **الـ DATABASE_URL** تلاقيه في Vercel → Storage → قاعدة بياناتك → **.env.local** أو **Connection String**

  هذا ينشئ جداول:
  - `admin_users` — حسابات الأدمن
  - `user_sessions` — الجلسات
  - `agents` — المناديب
  - `field_orders` — الطلبات الميدانية
  - `audit_logs` — سجل العمليات
  - `banners` — البانرات

  **وينشئ الحسابات تلقائياً:**

  | المستخدم | كلمة المرور | الصلاحية |
  |----------|------------|----------|
  | `admin` | `admin123` | مدير كامل |
  | `supervisor` | `Rafaqaa@Sup2025` | مشرف |

  > ⚠️ غيّر كلمات المرور فوراً من لوحة التحكم

  ---

  ## الخطوة 6 — ربط الدومين

  ### 6.1 أضف الدومين في Vercel
  Vercel → Settings → Domains → **Add Domain** → اكتب دومينك

  ### 6.2 حدّث DNS عند شركة الدومين

  ```
  A     @    →  76.76.21.21
  CNAME www  →  cname.vercel-dns.com
  ```

  انتظر من دقيقتين إلى ساعة — الموقع هيشتغل على دومينك.

  ---

  ## الخطوة 7 — Paymob Webhook (اختياري)

  في Paymob Dashboard → Settings → Webhook URL:
  ```
  https://your-domain.com/api/payments/webhook
  ```

  ---

  ## اختبار كل حاجة

  ```bash
  # فحص الخادم
  curl https://your-domain.com/api/health

  # اختبار تسجيل الدخول
  curl -X POST https://your-domain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'
  ```

  ---

  ## بيانات الدخول لأول مرة

  | الرابط | الوصف |
  |--------|-------|
  | `https://your-domain.com` | الموقع الرئيسي |
  | `https://your-domain.com/admin` | لوحة التحكم |
  | `https://your-domain.com/track` | تتبع التبرعات |
  | `https://your-domain.com/api/health` | فحص الخادم |

  ---

  ## حل المشكلات

  ### ❌ لا أستطيع تسجيل الدخول
  - تأكد أن `DATABASE_URL` موجود في Environment Variables
  - تأكد من تشغيل `db:push` لإنشاء جدول `admin_users`
  - تأكد أن `SESSION_SECRET` مضاف

  ### ❌ التبرعات لا تظهر
  - تأكد من `SUPABASE_URL` و `SUPABASE_ANON_KEY`
  - شغّل SQL الخطوة 1 في Supabase

  ### ❌ Function timeout
  - Vercel Hobby: max 10 ثواني — زد `maxDuration` في `vercel.json`

  ### ❌ CORS error
  - `VITE_API_URL` يجب أن يكون **فارغاً** تماماً

  ---

  ## ملفات التوثيق في الريبو

  | الملف | الوصف |
  |-------|-------|
  | `SETUP_GUIDE.html` | هذا الدليل بشكل مصور |
  | `DEPLOYMENT_GUIDE.html` | دليل النشر التفصيلي |
  | `INSTALL_GUIDE.html` | دليل التثبيت خطوة بخطوة |
  | `VERCEL_DEPLOY.md` | دليل Vercel التقني |
  | `AI_GUIDE.md` | دليل المطورين والـ API |

  ---

  *آخر تحديث: أبريل 2026 — مؤسسة رفقاء البررة*
  