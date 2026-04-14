# ملف التسليم الشامل — موقع رفقاء البررة
## Rafaqaa Al-Barrara Charity Website — Technical Handover

---

## 🎯 ما يحتاجه الفني لتشغيل الموقع 100%

### المتطلبات الأساسية (أحسابات يجب إنشاؤها):

---

## 1. Supabase — قاعدة البيانات الرئيسية (مجاني)

**الغرض:** تخزين التبرعات، الحملات، الإعدادات، البانرات

**رابط الإنشاء:** https://supabase.com

**الخطوات:**
1. أنشئ مشروع جديد
2. احفظ: `Project URL` و `anon/public key` و `service_role key`
3. شغّل السكريبت التالي من SQL Editor في Supabase:

```sql
-- جدول التبرعات
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

-- جدول الحملات
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

-- جدول الإعدادات
create table if not exists settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- جدول البانرات
create table if not exists banners (
  id uuid default gen_random_uuid() primary key,
  content text,
  type text default 'info',
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- جدول قصص النجاح
create table if not exists success_stories (
  id uuid default gen_random_uuid() primary key,
  title text,
  content text,
  image_url text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- سياسات الأمان (Row Level Security)
alter table donations enable row level security;
alter table campaigns enable row level security;
alter table settings enable row level security;
alter table banners enable row level security;

-- اسمح للـ service_role بكل العمليات
create policy "service_role_all" on donations for all using (true);
create policy "service_role_all" on campaigns for all using (true);
create policy "service_role_all" on settings for all using (true);
create policy "service_role_all" on banners for all using (true);

-- اسمح للزوار بقراءة الحملات والإعدادات والبانرات
create policy "public_read_campaigns" on campaigns for select using (true);
create policy "public_read_settings" on settings for select using (true);
create policy "public_read_banners" on banners for select using (true);
```

**متغيرات البيئة المطلوبة من Supabase:**
```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## 2. قاعدة بيانات PostgreSQL للـ Admin — (مدمجة في المنصة)

**الغرض:** تخزين حسابات الأدمن، الجلسات، إعدادات الدفع، المناديب

**إذا Vercel:** استخدم **Vercel Postgres** (مجاني Hobby)
**إذا Render:** استخدم **Render PostgreSQL** (مجاني 90 يوم ثم مدفوع)
**إذا Railway:** استخدم **Railway PostgreSQL** (5$ شهر)

**متغير البيئة:**
```
DATABASE_URL=postgresql://username:password@host:5432/dbname?sslmode=require
```

**بعد ضبط DATABASE_URL شغّل:**
```bash
pnpm --filter @workspace/api-server run db:push
```

**هيتم إنشاء الجداول تلقائياً وكمان حسابات الأدمن الافتراضية:**
- admin / admin123
- supervisor / Rafaqaa@Sup2025

---

## 3. Paymob — بوابة الدفع الإلكتروني (اختياري للبداية)

**الغرض:** قبول البطاقات البنكية، فودافون كاش، إنستاباي

**رابط:** https://paymob.com

**المطلوب من Paymob:**
- `API Key`
- `Integration ID` (للبطاقة البنكية)
- `Integration ID` (لفودافون كاش — إذا أردت)
- `Iframe ID`
- `HMAC Secret` (لتأمين الـ webhook)

**هل الموقع يشتغل بدون Paymob؟**
نعم ✅ — يعمل في وضع Demo يمكنك تأكيد التبرعات يدوياً من لوحة التحكم

**متغيرات البيئة:**
```
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_IFRAME_ID=
PAYMOB_HMAC_SECRET=
```

**إعداد الـ Webhook في Paymob:**
- اذهب لـ Paymob Dashboard → Settings → Webhook
- أضف: `https://yourdomain.com/api/payments/paymob/callback`
- اختر: Transaction Processed

---

## 4. WhatsApp API — رسائل التأكيد (اختياري)

**الغرض:** إرسال رسالة شكر تلقائية للمتبرع عند تأكيد التبرع

**الخيارات المتاحة:**

### أ) Meta Business API (الأقوى — مجاني 1000 رسالة/شهر)
- أنشئ تطبيق على https://developers.facebook.com
- فعّل WhatsApp Business API
- **المطلوب:**
```
WHATSAPP_TOKEN=EAAxxxxxxx
WHATSAPP_PHONE_ID=10xxxxxx
```

### ب) UltraMsg (أسهل وأسرع للإعداد — 9$/شهر)
- أنشئ حساب على https://ultramsg.com
- اربط هاتفك بـ QR code
- **المطلوب:**
```
ULTRAMSG_INSTANCE=instance123
ULTRAMSG_TOKEN=xxxxxxxx
```

### ج) بدون واتساب API
الرسائل لن تُرسل لكن الموقع يعمل بشكل طبيعي ✅

---

## 5. Telegram Bot — إشعارات الأدمن (موصى به جداً — مجاني)

**الغرض:** إشعار فوري للإدارة بكل تبرع جديد

**الخطوات:**
1. افتح تيليجرام وابحث عن `@BotFather`
2. أرسل `/newbot` وسمّه مثلاً "رفقاء البررة Bot"
3. احفظ الـ Token
4. أضف البوت لمجموعة أو قناة
5. احصل على الـ Chat ID من: `https://api.telegram.org/bot<TOKEN>/getUpdates`

**متغيرات البيئة:**
```
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234
TELEGRAM_CHAT_ID=-1001234567890
```

---

## 6. النشر على Vercel (مجاني)

### الخطوة 1: رفع الكود على GitHub
```bash
git add -A
git commit -m "Initial production deployment"
git push origin main
```

### الخطوة 2: ربط مع Vercel
1. اذهب لـ https://vercel.com
2. New Project → Import from GitHub
3. اختر المستودع

### الخطوة 3: إعداد الـ Build
لكل مشروع في Vercel أضف:

**Frontend (الموقع):**
- Root Directory: `artifacts/rafaqaa-website`
- Build Command: `pnpm build`
- Output Directory: `dist`

**Backend (السيرفر) — كـ Vercel Serverless:**
> ملاحظة: السيرفر مبني كـ Express — يمكن نشره على Render (مجاني) أو Railway

**أو استخدم Render للسيرفر:**
1. اذهب لـ https://render.com
2. New Web Service → Connect GitHub
3. Root Directory: `artifacts/api-server`
4. Build Command: `pnpm install && pnpm build`
5. Start Command: `node dist/index.js`
6. أضف كل متغيرات البيئة

### الخطوة 4: ربط السيرفر بالموقع
في Vercel → Environment Variables للموقع، أضف:
```
VITE_API_URL=https://rafaqaa-api.onrender.com
```

---

## 7. متغيرات البيئة الكاملة

### للسيرفر (api-server):
```env
# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Session Security (أنشئ نص عشوائي طويل)
SESSION_SECRET=your-super-secret-random-string-min-32-chars

# Paymob (اختياري)
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_IFRAME_ID=
PAYMOB_HMAC_SECRET=

# WhatsApp (اختياري)
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
# أو UltraMsg:
ULTRAMSG_INSTANCE=
ULTRAMSG_TOKEN=

# Telegram (اختياري لكن موصى به)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Email/SMTP (اختياري)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=app-password
SMTP_FROM=رفقاء البررة <noreply@rafaqaa.org>

NODE_ENV=production
PORT=3001
```

### للموقع (rafaqaa-website):
```env
VITE_API_URL=https://your-api-server.onrender.com
```

---

## 8. بيانات تسجيل الدخول الافتراضية

| المستخدم | كلمة المرور | الدور |
|---|---|---|
| `admin` | `admin123` | مدير كامل |
| `supervisor` | `Rafaqaa@Sup2025` | مشرف |

> **مهم جداً:** غيّر كلمات المرور فور تشغيل الموقع من لوحة التحكم → إدارة المستخدمين

---

## 9. قائمة تحقق الإطلاق ✅

- [ ] إنشاء Supabase وتشغيل SQL
- [ ] إعداد PostgreSQL (Render/Railway/Vercel)
- [ ] رفع الكود على GitHub
- [ ] نشر السيرفر (Render أو Railway)
- [ ] نشر الموقع (Vercel)
- [ ] إضافة كل متغيرات البيئة
- [ ] تشغيل `pnpm db:push` للجداول
- [ ] تغيير كلمات المرور الافتراضية
- [ ] اختبار تبرع تجريبي (Demo Mode)
- [ ] إعداد Paymob ووصل الـ Webhook
- [ ] إعداد WhatsApp API أو UltraMsg
- [ ] إعداد Telegram Bot للإشعارات
- [ ] تأكد من عمل صفحة /track للتتبع
- [ ] تأكد من وصول رسائل الواتساب للمتبرعين

---

## 10. هيكل المشروع

```
/
├── artifacts/
│   ├── rafaqaa-website/     ← الموقع (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/       ← الصفحات
│   │   │   ├── components/  ← المكونات
│   │   │   ├── contexts/    ← إدارة الحالة
│   │   │   └── lib/         ← API client
│   │   └── package.json
│   │
│   └── api-server/          ← السيرفر (Express + Node)
│       ├── src/
│       │   ├── routes/      ← مسارات الـ API
│       │   ├── lib/         ← مساعدات (supabase, etc)
│       │   └── index.ts     ← نقطة الدخول
│       └── package.json
│
├── packages/
│   └── db/                  ← Drizzle ORM schema
│
├── HANDOVER.md              ← هذا الملف
├── AI_GUIDE.md              ← دليل الذكاء الاصطناعي
└── SETUP_V2.md              ← دليل الإعداد التقني
```

---

## 11. مسارات API المهمة

| المسار | الطريقة | الوصف |
|---|---|---|
| `/api/campaigns` | GET | كل الحملات النشطة |
| `/api/donations` | POST | إنشاء تبرع جديد |
| `/api/donations/track` | GET | تتبع التبرع (phone/refqa) |
| `/api/payments/initiate` | POST | بدء دفع Paymob |
| `/api/payments/paymob/callback` | POST | Webhook من Paymob |
| `/api/payments/demo/confirm/:id` | POST | تأكيد يدوي (Demo) |
| `/api/settings/social_links` | GET | إعدادات الموقع |
| `/api/auth/login` | POST | تسجيل دخول الأدمن |
| `/api/admin/donations` | GET | كل التبرعات (أدمن) |

---

## 12. الدعم والمشاكل الشائعة

**الموقع لا يتصل بالسيرفر:**
- تأكد من إضافة `VITE_API_URL` في Vercel
- تأكد من أن السيرفر يعمل على Render

**خطأ في قاعدة البيانات:**
- تأكد من صحة `DATABASE_URL`
- شغّل `pnpm --filter @workspace/api-server run db:push`

**لا تصل رسائل واتساب:**
- تحقق من إعدادات واتساب في لوحة التحكم → الإشعارات
- تأكد من صحة Token وPhone ID

**الأدمن لا يستطيع تسجيل الدخول:**
- تأكد من تشغيل `db:push` (يُنشئ الحسابات الافتراضية تلقائياً)
- تأكد من وجود `SESSION_SECRET` في متغيرات البيئة

---

*آخر تحديث: أبريل 2025 — مؤسسة رفقاء البررة*
