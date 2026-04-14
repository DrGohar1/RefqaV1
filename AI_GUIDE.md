# 🤖 دليل الذكاء الاصطناعي — رفقاء البررة

> آخر تحديث: أبريل 2026 | للوكلاء الذكيين الذين يعملون على هذا المشروع

---

## 📌 نظرة عامة على المشروع

موقع تبرع رسمي لمؤسسة **رفقاء البررة للتنمية والخدمات الدينية والاجتماعية**  
مرخصة من وزارة التضامن الاجتماعي — إشهار رقم 7932 — جيزة

---

## 🏗 هيكل المشروع (Monorepo)

```
/
├── artifacts/
│   ├── rafaqaa-website/      # React + Vite — الواجهة الأمامية
│   │   └── src/
│   │       ├── components/   # Navbar, Footer, DonationModal, SplashScreen...
│   │       ├── contexts/     # AuthContext, FeatureFlagsContext, SocialLinksContext...
│   │       ├── pages/        # Index, Admin, Auth, TrackDonation, Zakat...
│   │       └── lib/          # api-client.ts, supabase-helpers.ts
│   └── api-server/           # Express.js — الخادم الخلفي
│       └── src/routes/       # donations, campaigns, settings, auth, payments...
├── packages/
│   └── db/                   # Drizzle ORM schema — PostgreSQL محلي
└── pnpm-workspace.yaml
```

---

## 🗄 قواعد البيانات (Full PostgreSQL)

**تم ترحيل كامل من Supabase إلى PostgreSQL (Neon) في أبريل 2026.**

| البيانات | الموقع | الأداة |
|----------|--------|--------|
| campaigns, donations, settings, audit_logs | **Neon PostgreSQL** | Drizzle ORM |
| admin_users, permission_types, banners, sessions | **Neon PostgreSQL** | Drizzle ORM |
| agents, field_orders | **Neon PostgreSQL** | Drizzle ORM |

> `supabase.ts` أصبح stub آمن — لا يتصل بـ Supabase، لمنع كسر الكود القديم.

---

## 🔑 بيانات الدخول الافتراضية

| المستخدم | كلمة المرور | الدور |
|----------|------------|-------|
| admin | admin123 | مدير كامل |
| supervisor | Rafaqaa@Sup2025 | مشرف |
| data_entry | (محدد في DB) | إدخال بيانات |
| viewer | (محدد في DB) | مشاهدة فقط |

> يتم إنشاؤها تلقائياً عند أول تشغيل بواسطة `ensureDefaults()` في `auth.ts`

---

## 🌐 مسارات API الرئيسية

### التبرعات
| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/api/donations` | كل التبرعات (admin) |
| GET | `/api/donations/track?phone=&refqa_id=` | تتبع عام للمتبرع |
| GET | `/api/donations/:id` | تبرع محدد |
| POST | `/api/donations` | إنشاء تبرع جديد |
| PATCH | `/api/donations/:id/status` | تغيير حالة (admin) |
| DELETE | `/api/donations/:id` | حذف تبرع (admin) |

### الإعدادات
| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/api/settings/:key` | قراءة أي إعداد |
| PUT | `/api/settings/:key` | تحديث إعداد (admin) |

**مفاتيح الإعدادات المهمة:**
- `general` — بيانات المؤسسة العامة
- `feature_flags` — تفعيل/تعطيل المميزات
- `social_links` — روابط السوشيال ميديا + واتساب
- `seo` — بيانات SEO
- `whatsapp_template` — قالب رسالة واتساب

### الدفع
| الطريقة | المسار | الوصف |
|--------|--------|-------|
| POST | `/api/payments/initiate` | بدء دفع Paymob |
| GET | `/api/payments/status/:refqa_id` | حالة الدفع |
| POST | `/api/payments/webhook` | Paymob webhook |
| GET | `/api/payment-settings/status` | هل Paymob مُفعَّل؟ |

---

## 📱 المكونات الرئيسية (Frontend)

| المكوّن | الملف | الوصف |
|---------|-------|-------|
| SplashScreen | `components/SplashScreen.tsx` | شاشة البداية المتحركة (مرة واحدة/session) |
| DonationModal | `components/DonationModal.tsx` | نافذة التبرع الكاملة (4 طرق دفع) |
| TrackDonation | `pages/TrackDonation.tsx` | تتبع التبرع بالهاتف أو رقم Refqa |
| Navbar | `components/Navbar.tsx` | زر الدخول للأدمن مخفي — يظهر فقط عند تسجيل الدخول |
| TopBar | `components/TopBar.tsx` | شريط علوي بروابط سوشيال ميديا ديناميكية |
| Footer | `components/Footer.tsx` | روابط سوشيال ميديا + تتبع + بيانات المطور |
| AdminSettings | `components/admin/AdminSettings.tsx` | 5 تبويبات: عام، سوشيال، واتساب، SEO، مميزات |
| AdminDonations | `components/admin/AdminDonations.tsx` | إدارة التبرعات + حذف + تعديل |

---

## ⚙️ Contexts المهمة

| Context | الملف | الوصف |
|---------|-------|-------|
| AuthContext | `contexts/AuthContext.tsx` | حالة تسجيل دخول الأدمن |
| FeatureFlagsContext | `contexts/FeatureFlagsContext.tsx` | `flags + refreshFlags()` |
| SocialLinksContext | `contexts/SocialLinksContext.tsx` | روابط سوشيال ميديا + واتساب |
| BasketContext | `contexts/BasketContext.tsx` | سلة التبرعات |
| ThemeContext | `contexts/ThemeContext.tsx` | الوضع الداكن/الفاتح |

---

## 🔐 الأمان والـ Session

- يستخدم `express-session` مع `connect-pg-simple` للـ PostgreSQL المحلي
- `SESSION_SECRET` متوفر كـ environment variable
- السيشن تُخزَّن في جدول `sessions` في PostgreSQL
- التحقق من الدخول: `(req.session as any).user` في كل route محمي
- زر "تسجيل الدخول" **مخفي من الـ Navbar** — للوصول للأدمن: `/auth` أو `/admin`

---

## 🎯 Feature Flags

الـ flags تُقرأ من `/api/settings/feature_flags` (PostgreSQL) عند بدء التطبيق وعند `refreshFlags()`.

| المفتاح | الوصف |
|---------|-------|
| `manual_payments` | الدفع اليدوي (تحويل + إيصال) |
| `api_payments` | بوابة Paymob الإلكترونية |
| `basket_system` | سلة التبرعات |
| `guest_donations` | التبرع بدون حساب |
| `zakat_calculator` | حاسبة الزكاة |
| `donation_ticker` | شريط آخر التبرعات |

---

## 💳 طرق الدفع

1. **دفع أونلاين** — Paymob (كارت، فوري، محافظ)
2. **تحويل يدوي** — فودافون كاش، إنستاباي، بنك (مع USSD + copy button)
3. **تحصيل منزلي** — مندوب يأتي للمنزل
4. **عن طريق مندوب** — مندوب ميداني

---

## 📲 Social Links

مُخزَّنة في PostgreSQL settings بمفتاح `social_links` — قابلة للتعديل من AdminSettings:
```json
{
  "facebook": "https://...",
  "instagram": "https://...",
  "youtube": "https://...",
  "twitter": "https://...",
  "tiktok": "https://...",
  "linkedin": "https://...",
  "whatsapp": "201130925036",
  "phone": "01130925036",
  "whatsapp_message": "السلام عليكم...",
  "address": "جمهورية مصر العربية",
  "email": "...",
  "developer_name": "GOHAR DEV",
  "developer_url": "https://..."
}
```

---

## 🚀 تشغيل المشروع

```bash
# تثبيت المكتبات
pnpm install

# تشغيل الواجهة
pnpm --filter @workspace/rafaqaa-website run dev

# تشغيل الخادم
pnpm --filter @workspace/api-server run dev

# إعداد DB schema
pnpm --filter @workspace/db run push
```

---

## ☁️ النشر على Vercel (Serverless)

### إعداد Vercel

المشروع يُنشر على Vercel كـ Serverless Function واحدة:
- **Static files**: `vercel-output/` (React build)
- **API Function**: `api/handler.mjs` (Express bundled by esbuild)

```bash
# متغيرات Vercel المطلوبة:
DATABASE_URL=postgresql://...
SESSION_SECRET=...
PAYMOB_API_KEY=... (اختياري)
```

### التشغيل التلقائي
1. دفع إلى GitHub main → Vercel يكتشف ويبني تلقائياً
2. Build Command: `pnpm --filter @workspace/rafaqaa-website run build && node api/build-for-vercel.mjs`
3. Output: `vercel-output/` + `api/handler.mjs`

---

## 🐛 استكشاف الأخطاء

| المشكلة | السبب | الحل |
|---------|-------|------|
| Vercel crash عند بدء التشغيل | كان supabase.ts يرمي خطأ | تم الإصلاح: stub آمن |
| Session لا تُحفظ | DB غير متصل | راجع `DATABASE_URL` في Vercel env vars |
| Social links لا تظهر | `social_links` غير محفوظ في DB | اضبطها من AdminSettings → تبويب السوشيال |
| Feature flags لا تعمل | `feature_flags` setting فارغ | ابذرها من API أو AdminSettings |
| Payment لا يعمل | Paymob غير مُفعَّل | تحقق من payment_settings في لوحة التحكم |
| Track لا يُرجع نتائج | phone غير مطابق | تأكد من نفس الصيغة عند التبرع |

---

## 📝 ملاحظات للوكيل الذكي

- **لا تغيّر** أنواع الـ ID في قاعدة البيانات (serial ↔ varchar) — يكسر البيانات الموجودة
- **الـ TypeScript errors** من نوع TS2305 قبل الوقت — esbuild يتجاهلها
- **الـ PORT**: يُقرأ من `process.env.PORT` أو `8080` افتراضياً
- **لا تستخدم Supabase** — supabase.ts أصبح stub لا يتصل بأي شيء
- أي تعديل على Settings يجب PUT إلى `/api/settings/:key` مع body `{ value: ... }`
- **api/handler.mjs لا يُرفع** — Vercel يبنيه تلقائياً من المصدر عند كل deploy
- **الـ GitHub integration** متصل ويمكن استخدامه لدفع commits عبر GitHub API

---

## 🔄 سجل التغييرات (Changelog)

### أبريل 2026 — تحديث شامل
- **إصلاح الجلسة على Vercel**: `connect-pg-simple` كان يقرأ `table.sql` عبر `__dirname` غير المعرَّف في ESM bundles. الإصلاح: إنشاء جدول `user_sessions` يدوياً عبر `pg.Pool` وتعيين `createTableIfMissing: false`.
- **AuthContext**: إضافة تمييز بين خطأ 401 (مسح الجلسة) وأخطاء الشبكة (الاحتفاظ بالـ cache).
- **SplashScreen**: animation احترافي بتأثيرات ذهبية، شريط تقدم، ونبضة الشعار.
- **HomeBanners**: StaticPaymentBanner يقرأ طرق الدفع من `/api/settings/payment_methods` ديناميكياً مع شريط متحرك.
- **TopBar + Footer**: إضافة أيقونات TikTok و LinkedIn كـ SVG.
- **DonationModal**: إضافة USSD deep links لأورنج كاش (`*8*`) واتصالات كاش (`*600*`).

### نقطة مهمة للـ Vercel
```typescript
// ❌ خطأ — يحاول قراءة table.sql عبر __dirname في ESM bundle
new PgSession({ conString: DB_URL, createTableIfMissing: true })

// ✅ صح — إنشاء الجدول يدوياً
const pool = new Pool({ connectionString: DB_URL });
await pool.query(`CREATE TABLE IF NOT EXISTS "user_sessions" (...)`);
new PgSession({ pool, createTableIfMissing: false })
```
