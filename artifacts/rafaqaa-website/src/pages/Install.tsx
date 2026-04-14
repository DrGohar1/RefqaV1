import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Globe, Shield, Zap, CheckCircle2, XCircle,
  Loader2, Eye, EyeOff, ChevronRight, ChevronLeft,
  Server, Bell, CreditCard, Key, Rocket, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api-client";
import logoStamp from "@/assets/logo-stamp.jpg";

// ── Types ──────────────────────────────────────────────────────────────────
interface FieldConfig { values: Record<string, string>; setValues: (v: Record<string, string>) => void }
interface TestResult { ok: boolean; message: string }

// ── Helpers ────────────────────────────────────────────────────────────────
function Field({ label, name, placeholder, type = "text", dir = "ltr", values, setValues }: {
  label: string; name: string; placeholder?: string; type?: string; dir?: string;
  values: Record<string, string>; setValues: (v: Record<string, string>) => void;
}) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-foreground">{label}</label>
      <div className="relative">
        <Input
          type={isPass && !show ? "password" : "text"}
          value={values[name] || ""}
          onChange={e => setValues({ ...values, [name]: e.target.value })}
          placeholder={placeholder}
          dir={dir}
          className="font-mono text-sm"
        />
        {isPass && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function TestBtn({ label, endpoint, payload, result, setResult }: {
  label: string; endpoint: string;
  payload: Record<string, string>;
  result: TestResult | null; setResult: (r: TestResult | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true); setResult(null);
    try {
      const res = await api.post(endpoint, payload);
      setResult(res as TestResult);
    } catch (e: any) {
      setResult({ ok: false, message: e.message });
    } finally { setLoading(false); }
  }
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button variant="outline" size="sm" onClick={run} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
        اختبار الاتصال
      </Button>
      {result && (
        <span className={`flex items-center gap-1.5 text-sm font-medium ${result.ok ? "text-emerald-600" : "text-red-500"}`}>
          {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {result.message}
        </span>
      )}
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "قاعدة البيانات",    icon: Database,    color: "text-blue-500" },
  { id: 2, label: "Supabase",          icon: Globe,       color: "text-green-500" },
  { id: 3, label: "الأمان",           icon: Shield,       color: "text-purple-500" },
  { id: 4, label: "الدفع والإشعارات", icon: CreditCard,   color: "text-amber-500" },
  { id: 5, label: "التثبيت",          icon: Rocket,       color: "text-emerald-500" },
];

// ── Main Component ────────────────────────────────────────────────────────
export default function Install() {
  const [step, setStep] = useState(1);
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);
  const [installResult, setInstallResult] = useState<any>(null);
  const [copied, setCopied] = useState("");

  const [dbValues,    setDbValues]    = useState<Record<string, string>>({});
  const [sbValues,    setSbValues]    = useState<Record<string, string>>({});
  const [secValues,   setSecValues]   = useState<Record<string, string>>({});
  const [extValues,   setExtValues]   = useState<Record<string, string>>({});

  const [dbTest,  setDbTest]  = useState<TestResult | null>(null);
  const [sbTest,  setSbTest]  = useState<TestResult | null>(null);
  const [pmTest,  setPmTest]  = useState<TestResult | null>(null);
  const [tgTest,  setTgTest]  = useState<TestResult | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  async function runInstall() {
    setInstalling(true);
    try {
      const result = await api.post("/install/run", {
        database_url:               dbValues.database_url || "",
        supabase_url:               sbValues.supabase_url || "",
        supabase_anon_key:          sbValues.supabase_anon_key || "",
        supabase_service_role_key:  sbValues.supabase_service_role_key || "",
        session_secret:             secValues.session_secret || "",
        paymob_api_key:             extValues.paymob_api_key || "",
        paymob_integration_id:      extValues.paymob_integration_id || "",
        paymob_iframe_id:           extValues.paymob_iframe_id || "",
        paymob_hmac_secret:         extValues.paymob_hmac_secret || "",
        telegram_bot_token:         extValues.telegram_bot_token || "",
        telegram_chat_id:           extValues.telegram_chat_id || "",
        whatsapp_token:             extValues.whatsapp_token || "",
        whatsapp_phone_id:          extValues.whatsapp_phone_id || "",
        frontend_url:               extValues.frontend_url || "",
      }) as any;
      setInstallResult(result);
      setDone(true);
    } catch (e: any) {
      setInstallResult({ ok: false, message: e.message });
    } finally { setInstalling(false); }
  }

  // ── Done Screen ─────────────────────────────────────────────────────────
  if (done && installResult?.ok) {
    const creds = installResult.credentials || {};
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900 flex items-center justify-center p-4" dir="rtl">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-card border border-border rounded-3xl p-8 max-w-lg w-full shadow-2xl text-center space-y-6">
          <div className="w-24 h-24 mx-auto">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ delay: 0.3, duration: 0.5 }}>
              <CheckCircle2 className="w-24 h-24 text-emerald-500" />
            </motion.div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">تم التثبيت بنجاح! 🎉</h1>
            <p className="text-muted-foreground mt-1">الموقع جاهز للعمل</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-right space-y-3">
            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">بيانات الدخول الافتراضية</p>
            {Object.entries(creds).map(([role, c]: [string, any]) => (
              <div key={role} className="bg-white dark:bg-black/20 rounded-xl p-3 font-mono text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">اسم المستخدم:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{c.username}</span>
                    <button onClick={() => copy(c.username, `u${role}`)} className="text-muted-foreground hover:text-foreground">
                      {copied === `u${role}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">كلمة المرور:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{c.password}</span>
                    <button onClick={() => copy(c.password, `p${role}`)} className="text-muted-foreground hover:text-foreground">
                      {copied === `p${role}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">⚠️ غيّر كلمات المرور فور تسجيل الدخول!</p>
          </div>
          <div className="space-y-2 text-sm text-right">
            {installResult.next_steps?.map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{s}</span>
              </div>
            ))}
          </div>
          <a href="/auth">
            <Button className="w-full gap-2" size="lg">
              <Rocket className="w-4 h-4" />
              اذهب للوحة التحكم
            </Button>
          </a>
        </motion.div>
      </div>
    );
  }

  // ── Main Wizard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-start py-8 px-4" dir="rtl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <img src={logoStamp} alt="logo" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20" />
        <div>
          <h1 className="text-xl font-bold">معالج تثبيت رفقاء البررة</h1>
          <p className="text-sm text-muted-foreground">اتبع الخطوات لإعداد الموقع</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  step > s.id ? "bg-emerald-500 border-emerald-500 text-white" :
                  step === s.id ? "bg-primary border-primary text-primary-foreground" :
                  "border-border text-muted-foreground"}`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : <s.icon className={`w-4 h-4 ${step === s.id ? "" : s.color}`} />}
                </div>
                <span className={`text-[10px] mt-1 font-medium hidden sm:block ${step === s.id ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors ${step > s.id ? "bg-emerald-500" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

            {/* ── Step 1: PostgreSQL ───────────────────────────────── */}
            {step === 1 && (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b border-border">
                  <Database className="w-6 h-6 text-blue-500" />
                  <div>
                    <h2 className="font-bold text-lg">قاعدة بيانات الأدمن</h2>
                    <p className="text-sm text-muted-foreground">تُستخدم لتخزين حسابات الأدمن، الجلسات، الإعدادات</p>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm space-y-1">
                  <p className="font-bold text-blue-700 dark:text-blue-300">من أين تحصل على DATABASE_URL؟</p>
                  <p>• <a href="https://vercel.com/storage/postgres" target="_blank" className="text-blue-500 underline">Vercel Postgres</a> — مجاني مع Vercel</p>
                  <p>• <a href="https://neon.tech" target="_blank" className="text-blue-500 underline">Neon.tech</a> — مجاني 100%</p>
                  <p>• <a href="https://railway.app" target="_blank" className="text-blue-500 underline">Railway</a> — 5$ / شهر</p>
                </div>
                <Field label="DATABASE_URL" name="database_url"
                  placeholder="postgresql://user:pass@host:5432/db?sslmode=require"
                  values={dbValues} setValues={setDbValues} />
                <TestBtn label="اختبار" endpoint="/install/test-db"
                  payload={{ database_url: dbValues.database_url || "" }}
                  result={dbTest} setResult={setDbTest} />
              </div>
            )}

            {/* ── Step 2: Supabase ─────────────────────────────────── */}
            {step === 2 && (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b border-border">
                  <Globe className="w-6 h-6 text-green-500" />
                  <div>
                    <h2 className="font-bold text-lg">Supabase</h2>
                    <p className="text-sm text-muted-foreground">تُستخدم لتخزين التبرعات والحملات — <a href="https://supabase.com" target="_blank" className="text-green-500 underline">supabase.com</a></p>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 text-sm space-y-1">
                  <p className="font-bold text-green-700 dark:text-green-300">خطوات Supabase:</p>
                  <p>1. أنشئ مشروع جديد على supabase.com</p>
                  <p>2. اذهب لـ Settings → API</p>
                  <p>3. انسخ Project URL + anon key + service_role key</p>
                </div>
                <Field label="Project URL" name="supabase_url"
                  placeholder="https://xxxxxxxx.supabase.co"
                  values={sbValues} setValues={setSbValues} />
                <Field label="Anon Key (public)" name="supabase_anon_key"
                  placeholder="eyJhbGci..." type="password"
                  values={sbValues} setValues={setSbValues} />
                <Field label="Service Role Key (secret)" name="supabase_service_role_key"
                  placeholder="eyJhbGci..." type="password"
                  values={sbValues} setValues={setSbValues} />
                <TestBtn label="اختبار Supabase" endpoint="/install/test-supabase"
                  payload={{ supabase_url: sbValues.supabase_url || "", supabase_anon_key: sbValues.supabase_anon_key || "" }}
                  result={sbTest} setResult={setSbTest} />
              </div>
            )}

            {/* ── Step 3: Security ─────────────────────────────────── */}
            {step === 3 && (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b border-border">
                  <Shield className="w-6 h-6 text-purple-500" />
                  <div>
                    <h2 className="font-bold text-lg">الأمان</h2>
                    <p className="text-sm text-muted-foreground">مفاتيح التشفير والحماية</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold mb-1">Session Secret</label>
                  <div className="relative">
                    <Input
                      value={secValues.session_secret || ""}
                      onChange={e => setSecValues({ ...secValues, session_secret: e.target.value })}
                      placeholder="نص عشوائي طويل — على الأقل 32 حرف"
                      className="font-mono text-sm pl-20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
                        const secret = Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
                        setSecValues({ ...secValues, session_secret: secret });
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-lg hover:opacity-80"
                    >
                      توليد
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">اضغط "توليد" لإنشاء مفتاح عشوائي آمن تلقائياً</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 text-sm">
                  <p className="font-bold text-purple-700 dark:text-purple-300 mb-1">مهم:</p>
                  <p>احتفظ بهذا المفتاح في مكان آمن. إذا تغيّر، ستنتهي صلاحية جميع الجلسات.</p>
                </div>
              </div>
            )}

            {/* ── Step 4: Integrations ─────────────────────────────── */}
            {step === 4 && (
              <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                <div className="flex items-center gap-3 pb-2 border-b border-border">
                  <Bell className="w-6 h-6 text-amber-500" />
                  <div>
                    <h2 className="font-bold text-lg">الدفع والإشعارات</h2>
                    <p className="text-sm text-muted-foreground">كلها اختيارية — يمكن إضافتها لاحقاً من الإعدادات</p>
                  </div>
                </div>

                {/* Paymob */}
                <div className="border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <p className="font-bold text-sm">Paymob — بوابة الدفع الإلكتروني</p>
                    <span className="text-xs text-muted-foreground">(اختياري)</span>
                  </div>
                  <Field label="API Key" name="paymob_api_key" type="password" values={extValues} setValues={setExtValues} />
                  <Field label="Integration ID" name="paymob_integration_id" values={extValues} setValues={setExtValues} />
                  <Field label="Iframe ID" name="paymob_iframe_id" values={extValues} setValues={setExtValues} />
                  <Field label="HMAC Secret" name="paymob_hmac_secret" type="password" values={extValues} setValues={setExtValues} />
                  <TestBtn label="اختبار Paymob" endpoint="/install/test-paymob"
                    payload={{ paymob_api_key: extValues.paymob_api_key || "" }}
                    result={pmTest} setResult={setPmTest} />
                </div>

                {/* Telegram */}
                <div className="border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sky-500" />
                    <p className="font-bold text-sm">Telegram Bot — إشعارات فورية</p>
                    <span className="text-xs text-muted-foreground">(اختياري — موصى به)</span>
                  </div>
                  <Field label="Bot Token (@BotFather)" name="telegram_bot_token" type="password" values={extValues} setValues={setExtValues} />
                  <Field label="Chat ID" name="telegram_chat_id" placeholder="-1001234567890" values={extValues} setValues={setExtValues} />
                  <TestBtn label="اختبار Telegram" endpoint="/install/test-telegram"
                    payload={{ telegram_bot_token: extValues.telegram_bot_token || "" }}
                    result={tgTest} setResult={setTgTest} />
                </div>

                {/* WhatsApp */}
                <div className="border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-green-500" />
                    <p className="font-bold text-sm">WhatsApp API — رسائل شكر المتبرعين</p>
                    <span className="text-xs text-muted-foreground">(اختياري)</span>
                  </div>
                  <Field label="WhatsApp Token (Meta)" name="whatsapp_token" type="password" values={extValues} setValues={setExtValues} />
                  <Field label="Phone ID (Meta)" name="whatsapp_phone_id" values={extValues} setValues={setExtValues} />
                </div>

                {/* Frontend URL */}
                <div className="border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-500" />
                    <p className="font-bold text-sm">رابط الموقع (بعد النشر)</p>
                    <span className="text-xs text-muted-foreground">(اختياري)</span>
                  </div>
                  <Field label="Frontend URL" name="frontend_url" placeholder="https://rafaqaa.vercel.app" values={extValues} setValues={setExtValues} />
                </div>
              </div>
            )}

            {/* ── Step 5: Install ──────────────────────────────────── */}
            {step === 5 && (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b border-border">
                  <Rocket className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h2 className="font-bold text-lg">التثبيت النهائي</h2>
                    <p className="text-sm text-muted-foreground">مراجعة وبدء التثبيت</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  {[
                    { label: "قاعدة البيانات",       ok: !!dbValues.database_url },
                    { label: "Supabase URL",          ok: !!sbValues.supabase_url },
                    { label: "Supabase Anon Key",     ok: !!sbValues.supabase_anon_key },
                    { label: "Supabase Service Key",  ok: !!sbValues.supabase_service_role_key },
                    { label: "Session Secret",        ok: !!secValues.session_secret },
                    { label: "Paymob",                ok: !!extValues.paymob_api_key, optional: true },
                    { label: "Telegram Bot",          ok: !!extValues.telegram_bot_token, optional: true },
                    { label: "WhatsApp",              ok: !!extValues.whatsapp_token, optional: true },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={`flex items-center gap-1 font-medium ${row.ok ? "text-emerald-600" : row.optional ? "text-muted-foreground" : "text-red-500"}`}>
                        {row.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : row.optional ? "—" : <XCircle className="w-3.5 h-3.5" />}
                        {row.ok ? "موجود" : row.optional ? "اختياري" : "مطلوب!"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Install button */}
                {!done && (
                  <div className="space-y-3">
                    {installResult?.ok === false && (
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4 inline ml-1" />
                        {installResult.message}
                      </div>
                    )}
                    <Button
                      onClick={runInstall}
                      disabled={installing || !dbValues.database_url || !sbValues.supabase_url || !secValues.session_secret}
                      className="w-full gap-2 h-12 text-base"
                    >
                      {installing ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> جاري التثبيت...</>
                      ) : (
                        <><Rocket className="w-5 h-5" /> ابدأ التثبيت الآن</>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      سيتم إنشاء جداول قاعدة البيانات وحسابات الأدمن تلقائياً
                    </p>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="border-t border-border px-6 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 1} className="gap-1">
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">{step} من {STEPS.length}</span>
          {step < STEPS.length && (
            <Button onClick={() => setStep(s => s + 1)} className="gap-1">
              التالي
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          {step === STEPS.length && <div />}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">مؤسسة رفقاء البررة — إشهار 7932</p>
    </div>
  );
}
