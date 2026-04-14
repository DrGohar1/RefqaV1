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
  ┌─────────────────────────────┐
  │          VERCEL             │
  │                             │
  │  Frontend (React/Vite) CDN  │
  │  +                          │
  │  API Serverless Functions   │
  │  (api/index.ts → Express)   │
  └─────────────────────────────┘
        │              │
        ▼              ▼
  ┌──────────┐   ┌──────────────┐
  │ Supabase │   │  PostgreSQL  │
  │ (Donatio │   │ (Admin/Sess) │
  │  ns, etc)│   │ Neon.tech    │
  └──────────┘   └──────────────┘
  ```

  > ✅ لا Render. لا Railway. كل حاجة على Vercel.

  ---

  ## المتطلبات

  | الحساب | الرابط | المجاني يكفي؟ |
  |--------|--------|--------------|
  | GitHub | github.com | ✅ |
  | Vercel | vercel.com | ✅ |
  | Supabase | supabase.com | ✅ |
  | Neon.tech (PostgreSQL) | neon.tech | ✅ |

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

  ## الخطوة 2 — إعداد PostgreSQL (Neon.tech)

  > لجداول الأدمن والجلسات — مجاني على Neon

  1. اذهب لـ [neon.tech](https://neon.tech) → **New Project**
  2. بعد الإنشاء، انسخ **Connection String** — مثال:
     ```
     postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
  3. هذا هو قيمة **DATABASE_URL** التي ستضيفها في Vercel

  ---

  ## الخطوة 3 — رفع الكود على GitHub

  ```bash
  git clone https://github.com/DrGohar1/RefqaV1.git
  cd RefqaV1
  git remote set-url origin https://github.com/DrGohar1/RefqaV1.git
  git push origin main
  ```

  أو إذا عندك fork خاص — اعمل fork من [github.com/DrGohar1/RefqaV1](https://github.com/DrGohar1/RefqaV1)

  ---

  ## الخطوة 4 — إنشاء مشروع Vercel

  1. اذهب لـ [vercel.com](https://vercel.com) → **Add New Project**
  2. اختر **Import Git Repository** → اختر **RefqaV1**
  3. Vercel هيكتشف `vercel.json` تلقائياً ❗ لا تغيّر أي إعدادات

  **إعدادات Build (تلقائية من vercel.json):**
  - Framework: Other  
  - Build Command: `pnpm --filter @workspace/rafaqaa-website run build`
  - Output Directory: `artifacts/rafaqaa-website/dist`

  ---

  ## الخطوة 5 — متغيرات البيئة في Vercel

  **Settings → Environment Variables → Add:**

  ### مطلوبة (الموقع لن يعمل بدونها)

  | الاسم | القيمة |
  |-------|--------|
  | `DATABASE_URL` | رابط Neon PostgreSQL |
  | `SUPABASE_URL` | رابط Supabase |
  | `SUPABASE_ANON_KEY` | anon key من Supabase |
  | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
  | `SESSION_SECRET` | نص عشوائي طويل (32+ حرف) |
  | `NODE_ENV` | `production` |
  | `VITE_API_URL` | **اتركه فارغاً** — API في نفس المشروع |

  ### لإنشاء SESSION_SECRET:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

  ### اختيارية — Paymob (الدفع الأونلاين)

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

  ## الخطوة 6 — أول نشر (Deploy)

  بعد إضافة المتغيرات، اضغط **Deploy** في Vercel.

  بعد انتهاء الـ Build، شغّل هذا الأمر مرة واحدة لإنشاء جداول الأدمن:

  ```bash
  # من جهازك المحلي
  git clone https://github.com/DrGohar1/RefqaV1.git
  cd RefqaV1
  npm install -g pnpm
  pnpm install
  DATABASE_URL="postgresql://..." pnpm --filter @workspace/db run push
  ```

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

  > ⚠️ غيّر كلمات المرور فوراً من لوحة التحكم → المستخدمون

  ---

  ## الخطوة 7 — إعداد Paymob Webhook (اختياري)

  في Paymob Dashboard → Settings → Webhook URL:
  ```
  https://your-site.vercel.app/api/payments/webhook
  ```

  ---

  ## الخطوة 8 — اختبار الموقع

  ```bash
  # فحص الخادم
  curl https://your-site.vercel.app/api/health

  # اختبار تسجيل الدخول
  curl -X POST https://your-site.vercel.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'
  ```

  ---

  ## بيانات الدخول لأول مرة

  | الرابط | الوصف |
  |--------|-------|
  | `https://your-site.vercel.app` | الموقع الرئيسي |
  | `https://your-site.vercel.app/admin` | لوحة التحكم |
  | `https://your-site.vercel.app/track` | تتبع التبرعات |
  | `https://your-site.vercel.app/api/health` | فحص الخادم |

  ---

  ## حل المشكلات الشائعة

  ### ❌ لا أستطيع تسجيل الدخول
  - تأكد أن `DATABASE_URL` يحتوي `?sslmode=require`
  - تأكد أن `SESSION_SECRET` موجود في Vercel
  - شغّل `db:push` لإنشاء جدول `admin_users`

  ### ❌ التبرعات لا تظهر
  - تأكد من `SUPABASE_URL` و `SUPABASE_ANON_KEY`
  - تأكد من إنشاء جداول Supabase من الخطوة 1
  - تأكد من تفعيل RLS policies

  ### ❌ Function timeout
  - الـ Hobby plan على Vercel يسمح بـ 10 ثواني فقط
  - زد `maxDuration` في `vercel.json` أو upgrade لـ Pro

  ### ❌ CORS error
  - `VITE_API_URL` يجب أن يكون **فارغاً** (لأن API في نفس Vercel domain)

  ### ❌ الصور لا تظهر
  - تأكد من `SUPABASE_URL` في Storage settings

  ---

  ## ملفات التوثيق

  | الملف | الوصف |
  |-------|-------|
  | `SETUP_GUIDE.html` | هذا الدليل بشكل مصور |
  | `DEPLOYMENT_GUIDE.html` | دليل النشر التفصيلي |
  | `INSTALL_GUIDE.html` | دليل التثبيت خطوة بخطوة |
  | `VERCEL_DEPLOY.md` | دليل Vercel التقني |
  | `AI_GUIDE.md` | دليل المطورين والـ API |

  ---

  *آخر تحديث: أبريل 2026 — مؤسسة رفقاء البررة*
  