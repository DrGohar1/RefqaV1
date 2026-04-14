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

## 🗄 قواعد البيانات (Hybrid DB)

| البيانات | الموقع | الأداة |
|----------|--------|--------|
| campaigns, donations, settings, payment_methods | **Supabase** | supabase-js client |
| users (admin), sessions, banners, agents, notification_settings | **PostgreSQL محلي** | Drizzle ORM |

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

الـ flags تُقرأ من Supabase عند بدء التطبيق وعند `refreshFlags()`.

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

مُخزَّنة في Supabase settings بمفتاح `social_links`:
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

## ☁️ النشر على Vercel + Render

### الخادم (Render.com)
1. Web Service → Node.js → Build: `pnpm --filter @workspace/api-server run build`
2. Start: `node artifacts/api-server/dist/index.mjs`
3. Variables: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SESSION_SECRET`

### الواجهة (Vercel)
1. Framework: Vite → Root: `artifacts/rafaqaa-website`
2. Build: `pnpm run build` → Output: `dist`
3. Variables: `VITE_API_URL=https://your-render-url.onrender.com`

---

## 🐛 استكشاف الأخطاء

| المشكلة | السبب | الحل |
|---------|-------|------|
| CORS error | الـ API URL خاطئ | تأكد من `VITE_API_URL` |
| Session لا تُحفظ | DB غير متصل | راجع `DATABASE_URL` |
| Social links لا تظهر | `social_links` غير محفوظ | اضبطها من AdminSettings |
| Payment لا يعمل | Paymob غير مُفعَّل | تحقق من payment_settings في DB |
| Feature flag لا يتغير | يحتاج `refreshFlags()` | يتم تلقائياً بعد الحفظ |

---

## 📝 ملاحظات للوكيل الذكي

- **لا تغيّر** أنواع الـ ID في قاعدة البيانات (serial ↔ varchar)
- **الـ TypeScript errors** من نوع TS2305 قبل الوقت — esbuild يتجاهلها
- **الـ PORT**: يُقرأ من `process.env.PORT` أو `8080` افتراضياً
- **الـ Sessions** تستخدم PostgreSQL المحلي، ليس Supabase
- أي تعديل على Settings يجب أن يستخدم مفتاح `key` صحيح في جدول `settings`
