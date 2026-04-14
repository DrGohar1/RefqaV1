<div align="center">

<img src="https://img.shields.io/badge/رفقاء_البررة-v2.0-00a86b?style=for-the-badge&labelColor=1a3a2a" alt="Version"/>
<img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
<img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
<img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
<img src="https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>

# 🤝 رفقاء البررة — Rafaqaa Al-Barrara

### منصة التبرع الرقمية الشاملة للجمعيات الخيرية المصرية

[🌐 العرض المباشر](https://refqa.org) · [📖 دليل التثبيت](docs/SETUP_GUIDE.html) · [🚀 دليل Vercel](docs/VERCEL_DEPLOY.md) · [📋 دليل الفني](docs/HANDOVER.md)

</div>

---

## 📋 نظرة عامة

**رفقاء البررة** هي منصة تبرع رقمية متكاملة مصممة للجمعيات والمؤسسات الخيرية المصرية، تتيح للمتبرعين التبرع بسهولة عبر الدفع الأونلاين أو التحويل اليدوي، مع لوحة تحكم شاملة للإدارة ونظام متكامل للتقارير والإشعارات.

---

## ✨ المميزات الرئيسية

| الميزة | الوصف |
|--------|--------|
| 💳 **دفع أونلاين** | تكامل كامل مع Paymob — فيزا، ماستركارد، فوري، محافظ إلكترونية |
| 💸 **دفع يدوي** | فودافون كاش، أورنج كاش، اتصالات كاش، انستاباي، تحويل بنكي |
| 🏠 **تحصيل منزلي** | إرسال مندوب للمتبرع مع نظام تتبع كامل |
| 📊 **لوحة تحكم متكاملة** | إدارة التبرعات، الحملات، المندوبين، المستخدمين والصلاحيات |
| 🔔 **إشعارات فورية** | واتساب وتيليجرام لكل تبرع تلقائياً |
| 🔍 **تتبع التبرع** | المتبرع يتابع تبرعه برقم الهاتف ورقم رفقة |
| 🧩 **معالج تثبيت** | واجهة تثبيت مثل WordPress بدون أي كود |
| 🛡️ **صلاحيات متعددة** | أدمن، مشرف، مستخدم مخصص — تحكم دقيق بالصلاحيات |
| 🌍 **SEO كامل** | Open Graph، Twitter Cards، Google Analytics، Facebook Pixel |
| 🔴 **Kill Switch** | إيقاف الموقع فوراً بزر واحد عند الصيانة |
| 🎯 **نظام المناديب** | تتبع أداء المناديب الميدانيين مع تقارير التحصيل |
| 🛒 **سلة التبرعات** | التبرع لعدة حملات في آن واحد |

---

## 🗂️ هيكل المشروع

```
rafaqaa-v2/
│
├── 📁 artifacts/
│   ├── rafaqaa-website/              # الواجهة الأمامية
│   │   └── src/
│   │       ├── components/           # المكونات المشتركة
│   │       │   ├── admin/            # مكونات لوحة التحكم
│   │       │   ├── DonationModal.tsx # نافذة التبرع الرئيسية
│   │       │   ├── Navbar.tsx        # شريط التنقل
│   │       │   └── Footer.tsx        # تذييل الصفحة
│   │       ├── pages/
│   │       │   ├── Index.tsx         # الصفحة الرئيسية
│   │       │   ├── Admin.tsx         # لوحة التحكم
│   │       │   ├── Track.tsx         # تتبع التبرع
│   │       │   ├── Pay.tsx           # بوابة الدفع
│   │       │   └── Install.tsx       # معالج التثبيت
│   │       ├── contexts/             # Global State
│   │       │   ├── AuthContext.tsx
│   │       │   ├── FeatureFlagsContext.tsx
│   │       │   └── SocialLinksContext.tsx
│   │       └── lib/
│   │           ├── supabase-helpers.ts
│   │           └── api-client.ts
│   │
│   └── api-server/                   # الخادم الخلفي
│       └── src/
│           ├── routes/               # API Endpoints
│           │   ├── auth.ts           # المصادقة
│           │   ├── donations.ts      # التبرعات
│           │   ├── payments.ts       # المدفوعات (Paymob)
│           │   ├── campaigns.ts      # الحملات
│           │   ├── agents.ts         # المناديب
│           │   ├── admin-users.ts    # مستخدمو الأدمن
│           │   ├── settings.ts       # الإعدادات
│           │   ├── field-orders.ts   # طلبات التحصيل الميداني
│           │   └── install.ts        # معالج التثبيت
│           ├── app.ts                # Express App
│           └── db.ts                 # Drizzle ORM
│
├── 📁 api/
│   └── index.ts                      # Vercel Serverless Function
│
├── 📁 docs/
│   ├── HANDOVER.md                   # دليل الفني الشامل
│   ├── SETUP_GUIDE.html              # دليل التثبيت المصوّر
│   └── VERCEL_DEPLOY.md              # دليل رفع Vercel
│
├── vercel.json                       # إعداد Vercel
├── install.sh                        # سكريبت التثبيت
└── pnpm-workspace.yaml               # Monorepo config
```

---

## 🚀 التشغيل السريع

### المتطلبات

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+ أو Supabase
- حساب Supabase (للتخزين والإعدادات الديناميكية)

### 1. استنساخ المشروع

```bash
git clone https://github.com/DrGohar1/RefqaV2.git
cd RefqaV2
pnpm install
```

### 2. إعداد متغيرات البيئة

```bash
cp .env.example .env
```

أو افتح `/install` بعد الرفع واملأ البيانات من الواجهة.

### 3. تهيئة قاعدة البيانات

```bash
pnpm --filter @workspace/api-server run db:push
```

### 4. التشغيل المحلي

```bash
# الواجهة الأمامية
pnpm --filter @workspace/rafaqaa-website dev

# الخادم الخلفي (terminal آخر)
pnpm --filter @workspace/api-server dev
```

---

## ⚙️ متغيرات البيئة

```env
# ─── قاعدة البيانات ───────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@host:5432/rafaqaa

# ─── Supabase ─────────────────────────────────────────────────
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# ─── الأمان ───────────────────────────────────────────────────
SESSION_SECRET=your-super-secret-minimum-32-chars
NODE_ENV=production

# ─── Paymob (اختياري — للدفع الأونلاين) ──────────────────────
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_HMAC_SECRET=

# ─── Telegram (اختياري — للإشعارات) ──────────────────────────
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# ─── الواجهة ──────────────────────────────────────────────────
FRONTEND_URL=https://your-domain.com
VITE_API_URL=                         # اتركه فارغاً على Vercel
```

---

## ☁️ النشر على Vercel

```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel --prod
```

ثم افتح `https://your-domain.vercel.app/install` لإكمال الإعداد.

### جداول Supabase المطلوبة

شغّل SQL التالي في **Supabase → SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_name TEXT NOT NULL,
  donor_phone TEXT,
  donor_email TEXT,
  amount NUMERIC NOT NULL,
  campaign_id UUID,
  campaign_title TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  operation_id TEXT UNIQUE,
  receipt_image_url TEXT,
  user_id TEXT,
  refqa_id TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC DEFAULT 0,
  collected_amount NUMERIC DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  campaign_type TEXT DEFAULT 'general',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT,
  type TEXT DEFAULT 'info',
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS success_stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  donor_name TEXT,
  campaign_title TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔑 بيانات الدخول الافتراضية

| المستخدم | كلمة المرور | الدور |
|---------|------------|-------|
| `admin` | `admin123` | مدير كامل الصلاحيات |
| `supervisor` | `Rafaqaa@Sup2025` | مشرف |

> ⚠️ **غيّر كلمات المرور فور التثبيت من: الإعدادات → المستخدمون**

---

## 📡 API Reference

### المصادقة
```
POST /api/auth/login          تسجيل الدخول
POST /api/auth/logout         تسجيل الخروج
GET  /api/auth/me             بيانات المستخدم الحالي
```

### التبرعات
```
GET    /api/donations          قائمة التبرعات (أدمن)
GET    /api/donations/track    تتبع تبرع (عام)
PATCH  /api/donations/:id      تحديث حالة
DELETE /api/donations/:id      حذف
```

### المدفوعات
```
POST /api/payments/initiate      بدء دفع Paymob
POST /api/payments/webhook       Webhook من Paymob
POST /api/payments/demo-confirm  تأكيد تجريبي
GET  /api/payment-settings/status حالة إعداد Paymob
```

### الحملات والإعدادات
```
GET/POST   /api/campaigns         إدارة الحملات
GET/PATCH  /api/settings/:key     إعدادات الموقع
GET/POST   /api/agents            إدارة المناديب
GET        /api/agents/:id/orders طلبات مندوب معين
GET/POST   /api/field-orders      طلبات التحصيل الميداني
GET/POST   /api/admin-users       مستخدمو الأدمن
```

---

## 🛡️ الأمان

| الطبقة | الحماية |
|--------|---------|
| المصادقة | Session-based + bcrypt |
| قاعدة البيانات | Drizzle ORM (منع SQL Injection) |
| الـ API | Rate limiting + Helmet headers |
| الجلسات | PostgreSQL session store |
| CORS | مضبوط للدومين الرسمي فقط |
| الرفع | فحص نوع الملف + حجم أقصى |
| البيانات | Input validation + sanitization |

---

## 📱 صفحات الموقع

| الصفحة | الرابط | الوصف |
|--------|-------|--------|
| الرئيسية | `/` | الحملات، التبرع، قصص النجاح |
| تتبع التبرع | `/track` | تتبع برقم الهاتف أو رقم رفقة |
| بوابة الدفع | `/pay` | دفع Paymob مدمج |
| لوحة التحكم | `/admin` | إدارة شاملة |
| معالج التثبيت | `/install` | إعداد الموقع لأول مرة |

---

## 🎛️ لوحة التحكم — الأقسام

| القسم | المحتوى |
|-------|---------|
| **📊 الرئيسية** | إحصائيات، آخر التبرعات، نشاط الموقع |
| **💰 التبرعات والمدفوعات** | تبرعات، حالات، طرق دفع، طلبات ميدانية |
| **📣 الحملات والمحتوى** | حملات، بانرات، قصص نجاح، SEO |
| **⚙️ الإعدادات والنظام** | إعدادات عامة، مستخدمين، مناديب، ميزات |

---

## 🤝 المساهمة

1. Fork المشروع
2. `git checkout -b feature/your-feature`
3. `git commit -m 'Add your feature'`
4. `git push origin feature/your-feature`
5. افتح Pull Request

---

## 📄 الترخيص

MIT License — راجع [LICENSE](LICENSE) للتفاصيل.

---

## 👨‍💻 المطور

**GOHAR DEV** — تطوير برامج ومنصات خيرية

---

<div align="center">

صُنع بـ ❤️ لخدمة المحتاجين

**رفقاء البررة** — *الشهر 7932 — جيزة، مصر*

</div>
