#!/usr/bin/env bash
# ============================================================
# install.sh — سكريبت التنصيب الآلي — رفقاء البررة
# ============================================================
# الاستخدام:
#   1. افتح الملف وأملأ بياناتك في القسم الأول
#   2. شغّله:  bash install.sh
# ============================================================

set -e

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ██████  أملأ بياناتك هنا  ██████
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ── قاعدة بيانات الأدمن (PostgreSQL) ──────────────────────
# Vercel Postgres أو Neon أو Railway
DATABASE_URL=""
# مثال:
# DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"

## ── Supabase (التبرعات والحملات) ────────────────────────────
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
# مثال:
# SUPABASE_URL="https://xxxxxxxx.supabase.co"
# SUPABASE_ANON_KEY="eyJhbGci..."
# SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

## ── Session Secret (اكتب أي نص طويل عشوائي) ────────────────
SESSION_SECRET=""
# مثال:
# SESSION_SECRET="Rafaqaa@2025!SecureSession#xyz789abc"

## ── Paymob (اختياري — للدفع الإلكتروني) ────────────────────
PAYMOB_API_KEY=""
PAYMOB_INTEGRATION_ID=""
PAYMOB_IFRAME_ID=""
PAYMOB_HMAC_SECRET=""

## ── Telegram Bot (اختياري — موصى به للإشعارات) ─────────────
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""

## ── WhatsApp (اختياري — لرسائل شكر المتبرعين) ──────────────
# خيار أ: Meta Business API
WHATSAPP_TOKEN=""
WHATSAPP_PHONE_ID=""
# خيار ب: UltraMsg (أسهل)
ULTRAMSG_INSTANCE=""
ULTRAMSG_TOKEN=""

## ── Email/SMTP (اختياري) ────────────────────────────────────
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""

## ── URL الموقع (بعد النشر على Vercel) ──────────────────────
# FRONTEND_URL="https://rafaqaa.vercel.app"
FRONTEND_URL=""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  لا تعدّل ما تحت هذا السطر
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

banner() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err()  { echo -e "${RED}  ✗ $1${NC}"; }
info() { echo -e "  ℹ $1"; }

banner "مرحباً — سكريبت تنصيب رفقاء البررة"
echo ""
echo -e "  ${BOLD}هذا السكريبت سيقوم بـ:${NC}"
echo "  1. التحقق من البيانات المدخلة"
echo "  2. إنشاء ملفات .env"
echo "  3. تثبيت الحزم"
echo "  4. إنشاء جداول قاعدة البيانات"
echo "  5. اختبار الاتصالات"
echo ""

# ── التحقق من المتطلبات الأساسية ──────────────────────────
banner "الخطوة 1 — التحقق من المتطلبات"

if ! command -v node &>/dev/null; then
  err "Node.js غير مثبت. حمّله من https://nodejs.org"
  exit 1
fi
ok "Node.js $(node -v)"

if ! command -v pnpm &>/dev/null; then
  warn "pnpm غير موجود — جاري التثبيت..."
  npm install -g pnpm
fi
ok "pnpm $(pnpm -v)"

# ── التحقق من البيانات المطلوبة ───────────────────────────
banner "الخطوة 2 — التحقق من البيانات"

ERRORS=0

check_required() {
  local VAR_NAME="$1"
  local VAR_VAL="$2"
  local LABEL="$3"
  if [ -z "$VAR_VAL" ]; then
    err "مطلوب: $LABEL ($VAR_NAME) — لم يُملأ"
    ERRORS=$((ERRORS+1))
  else
    ok "$LABEL — موجود ✓"
  fi
}

check_optional() {
  local VAR_NAME="$1"
  local VAR_VAL="$2"
  local LABEL="$3"
  if [ -z "$VAR_VAL" ]; then
    warn "$LABEL — غير مُضاف (اختياري)"
  else
    ok "$LABEL — موجود ✓"
  fi
}

check_required "DATABASE_URL"               "$DATABASE_URL"               "قاعدة بيانات PostgreSQL"
check_required "SUPABASE_URL"               "$SUPABASE_URL"               "Supabase URL"
check_required "SUPABASE_ANON_KEY"          "$SUPABASE_ANON_KEY"          "Supabase Anon Key"
check_required "SUPABASE_SERVICE_ROLE_KEY"  "$SUPABASE_SERVICE_ROLE_KEY"  "Supabase Service Role Key"
check_required "SESSION_SECRET"             "$SESSION_SECRET"             "Session Secret"

echo ""
check_optional "PAYMOB_API_KEY"       "$PAYMOB_API_KEY"       "Paymob API Key"
check_optional "TELEGRAM_BOT_TOKEN"   "$TELEGRAM_BOT_TOKEN"   "Telegram Bot"
check_optional "WHATSAPP_TOKEN"       "$WHATSAPP_TOKEN"       "WhatsApp Token"
check_optional "ULTRAMSG_TOKEN"       "$ULTRAMSG_TOKEN"       "UltraMsg Token"
check_optional "SMTP_HOST"            "$SMTP_HOST"            "SMTP Email"
check_optional "FRONTEND_URL"         "$FRONTEND_URL"         "Frontend URL"

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  err "يوجد $ERRORS حقل مطلوب فارغ. ارجع لأعلى الملف وأملأ البيانات."
  exit 1
fi

# ── إنشاء ملف .env للسيرفر ────────────────────────────────
banner "الخطوة 3 — إنشاء ملفات البيئة"

cat > artifacts/api-server/.env << EOF
# تم الإنشاء تلقائياً بواسطة install.sh — $(date)

# Database
DATABASE_URL=${DATABASE_URL}

# Supabase
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Security
SESSION_SECRET=${SESSION_SECRET}
NODE_ENV=production

# Paymob
PAYMOB_API_KEY=${PAYMOB_API_KEY}
PAYMOB_INTEGRATION_ID=${PAYMOB_INTEGRATION_ID}
PAYMOB_IFRAME_ID=${PAYMOB_IFRAME_ID}
PAYMOB_HMAC_SECRET=${PAYMOB_HMAC_SECRET}

# Telegram
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}

# WhatsApp
WHATSAPP_TOKEN=${WHATSAPP_TOKEN}
WHATSAPP_PHONE_ID=${WHATSAPP_PHONE_ID}
ULTRAMSG_INSTANCE=${ULTRAMSG_INSTANCE}
ULTRAMSG_TOKEN=${ULTRAMSG_TOKEN}

# Email
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM=${SMTP_FROM}

# Frontend
FRONTEND_URL=${FRONTEND_URL}
EOF
ok "تم إنشاء artifacts/api-server/.env"

cat > artifacts/rafaqaa-website/.env << EOF
# تم الإنشاء تلقائياً بواسطة install.sh — $(date)
VITE_API_URL=
EOF
ok "تم إنشاء artifacts/rafaqaa-website/.env"

# ── تثبيت الحزم ───────────────────────────────────────────
banner "الخطوة 4 — تثبيت الحزم"
info "جاري تثبيت جميع الحزم (قد يستغرق دقيقتين)..."
pnpm install
ok "تم تثبيت الحزم"

# ── إنشاء جداول قاعدة البيانات ────────────────────────────
banner "الخطوة 5 — إنشاء جداول الأدمن"
info "جاري إنشاء جداول قاعدة بيانات الأدمن..."

if DATABASE_URL="$DATABASE_URL" pnpm --filter @workspace/api-server run db:push 2>&1; then
  ok "تم إنشاء الجداول بنجاح"
  info "تم إنشاء حسابات الأدمن الافتراضية:"
  info "  • admin / admin123"
  info "  • supervisor / Rafaqaa@Sup2025"
else
  err "فشل إنشاء الجداول — تحقق من DATABASE_URL"
  exit 1
fi

# ── اختبار الاتصال بـ Supabase ────────────────────────────
banner "الخطوة 6 — اختبار الاتصالات"

info "اختبار Supabase..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/campaigns?limit=1" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "206" ]; then
  ok "Supabase — الاتصال ناجح"
elif [ "$HTTP_STATUS" = "000" ]; then
  warn "Supabase — تعذّر الاختبار (curl غير متاح)"
else
  warn "Supabase — رد HTTP: $HTTP_STATUS (قد تحتاج لإنشاء الجداول في SQL Editor)"
fi

# اختبار Paymob إذا كان موجوداً
if [ -n "$PAYMOB_API_KEY" ]; then
  info "اختبار Paymob API..."
  PM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "https://accept.paymob.com/api/auth/tokens" \
    -H "Content-Type: application/json" \
    -d "{\"api_key\":\"$PAYMOB_API_KEY\"}" 2>/dev/null || echo "000")
  if [ "$PM_STATUS" = "200" ]; then
    ok "Paymob — الاتصال ناجح"
  else
    warn "Paymob — رد HTTP: $PM_STATUS (تحقق من API Key)"
  fi
fi

# اختبار Telegram إذا كان موجوداً
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
  info "اختبار Telegram Bot..."
  TG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" 2>/dev/null || echo "000")
  if [ "$TG_STATUS" = "200" ]; then
    ok "Telegram Bot — صحيح"
  else
    warn "Telegram Bot — رد HTTP: $TG_STATUS (تحقق من Token)"
  fi
fi

# ── النتيجة النهائية ───────────────────────────────────────
banner "✅ اكتمل التنصيب!"
echo ""
echo -e "${BOLD}  الخطوات التالية:${NC}"
echo ""
echo "  1. لتشغيل السيرفر محلياً:"
echo "     pnpm --filter @workspace/api-server run dev"
echo ""
echo "  2. لتشغيل الموقع محلياً:"
echo "     pnpm --filter @workspace/rafaqaa-website run dev"
echo ""
echo "  3. للنشر على Vercel:"
echo "     - ارفع الكود على GitHub"
echo "     - اربط الـ repo بـ Vercel"
echo "     - أضف نفس المتغيرات في Vercel → Environment Variables"
echo "     - راجع ملف VERCEL_DEPLOY.md للتفاصيل"
echo ""
echo -e "  ${YELLOW}تذكّر: غيّر كلمات المرور الافتراضية فور أول دخول!${NC}"
echo ""
echo -e "${GREEN}  مؤسسة رفقاء البررة — إشهار 7932${NC}"
echo ""
