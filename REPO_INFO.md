# 📦 رفقاء البررة — معلومات الريبو والنشر

## 🔗 رابط الريبو على GitHub

```
https://github.com/DrGohar/RefqaV2
```

> **ملاحظة مهمة:** الريبو **Private (خاص)** — لازم تكون مسجل دخول بحساب `DrGohar` على GitHub عشان تشوفه.

---

## 📊 إحصائيات الريبو

| البيان | التفاصيل |
|--------|----------|
| الاسم | RefqaV2 |
| المالك | DrGohar |
| النوع | Private (خاص) |
| الفرع الرئيسي | main |
| عدد الملفات | 288 ملف |
| تاريخ الإنشاء | 29 مارس 2026 |

---

## 🔑 بيانات الدخول للأدمن

| المستخدم | كلمة المرور | الصلاحيات |
|----------|-------------|-----------|
| `admin` | `admin123` | كامل الصلاحيات |
| `supervisor` | `Rafaqaa@Sup2025` | مشرف (حملات، تبرعات، بانرات) |
| `data_entry` | `Rafaqaa@Data2025` | إدخال بيانات فقط |
| `viewer` | `Rafaqaa@View2025` | مشاهدة تقارير فقط |

> ⚠️ غيّر كلمة مرور `admin` فوراً بعد أول تسجيل دخول!

---

## 🚀 خطوات النشر السريع

### الطريقة 1: Replit Deploy (الأسرع — دقيقتان)
1. اضغط زر **Publish** في Replit
2. ستحصل على رابط: `rafaqaa-website.replit.app`
3. ✅ خلاص — الموقع لايف!

---

### الطريقة 2: Vercel (Frontend) + Railway (Backend)

#### الـ Frontend على Vercel
1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط **Add New Project**
3. Import من GitHub → اختار **RefqaV2**
4. ضبط الإعدادات:
   - **Root Directory:** `artifacts/rafaqaa-website`
   - **Framework:** Vite
5. أضف Environment Variables:
   ```
   VITE_SUPABASE_URL=رابط_سوبابيس
   VITE_SUPABASE_ANON_KEY=مفتاح_سوبابيس
   VITE_API_URL=رابط_railway_server
   ```
6. اضغط **Deploy**

#### الـ Backend على Railway
1. اذهب إلى [railway.app](https://railway.app)
2. New Project → Deploy from GitHub → **RefqaV2**
3. ضبط الإعدادات:
   - **Root Directory:** `artifacts/api-server`
4. أضف PostgreSQL database من Railway
5. أضف Environment Variables:
   ```
   DATABASE_URL=رابط_قاعدة_البيانات
   SESSION_SECRET=كلمة_سر_طويلة_عشوائية
   PAYMOB_API_KEY=مفتاح_باي_موب
   PAYMOB_CARD_INTEGRATION_ID=رقم_التكامل
   PAYMOB_CARD_IFRAME_ID=رقم_الـiframe
   SUPABASE_URL=رابط_سوبابيس
   SUPABASE_SERVICE_KEY=مفتاح_الخدمة
   CORS_ORIGIN=رابط_فيرسيل
   NODE_ENV=production
   PORT=3000
   ```

---

## 🏗️ هيكل المشروع

```
RefqaV2/
├── artifacts/
│   ├── rafaqaa-website/     ← الـ Frontend (React + Vite)
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Home.tsx          ← الصفحة الرئيسية
│   │       │   └── Admin.tsx         ← لوحة التحكم
│   │       └── components/
│   │           ├── DonationModal.tsx ← نافذة التبرع (4 طرق دفع)
│   │           ├── HomeBanners.tsx   ← بانرات الصفحة الرئيسية
│   │           ├── admin/
│   │           │   ├── AdminDonations.tsx
│   │           │   ├── AdminCampaigns.tsx
│   │           │   ├── AdminUsers.tsx
│   │           │   ├── AdminAgents.tsx
│   │           │   └── AdminFieldOrders.tsx
│   └── api-server/          ← الـ Backend (Express.js)
│       └── src/
│           └── routes/
│               ├── donations.ts
│               ├── campaigns.ts
│               ├── banners.ts
│               ├── admin-users.ts
│               ├── agents.ts
│               ├── field-orders.ts
│               └── payments.ts      ← Paymob integration
├── lib/
│   └── db/
│       └── src/schema/index.ts      ← Drizzle schema (PostgreSQL)
└── DEPLOYMENT_GUIDE.html            ← دليل النشر الكامل (HTML)
```

---

## 💳 طرق الدفع المتاحة

| الطريقة | الوصف |
|---------|-------|
| 🌐 **أونلاين (Paymob)** | فيزا / ماستركارد / محافظ إلكترونية |
| 🏦 **تحويل بنكي** | رفع إيصال التحويل |
| 🏠 **توصيل للمنزل** | مندوب يجي يستلم التبرع |
| 👤 **طلب مندوب** | تسجيل طلب لمقابلة مندوب |

---

## 📞 للدعم الفني
راجع ملف `DEPLOYMENT_GUIDE.html` في الريبو للتفاصيل الكاملة.
