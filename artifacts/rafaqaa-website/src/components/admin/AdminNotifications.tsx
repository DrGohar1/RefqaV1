import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Send, CheckCircle2, AlertCircle, Loader2, Save, Eye, EyeOff,
  MessageCircle, Phone, Mail, BotMessageSquare, Settings2, TestTube2, Bell
} from "lucide-react";

type Tab = "telegram" | "whatsapp" | "twilio" | "email";

const TABS: { id: Tab; label: string; icon: any; color: string }[] = [
  { id: "telegram", label: "تيليجرام بوت", icon: BotMessageSquare, color: "text-blue-500" },
  { id: "whatsapp", label: "واتساب API", icon: MessageCircle, color: "text-green-500" },
  { id: "twilio", label: "Twilio SMS", icon: Phone, color: "text-red-500" },
  { id: "email", label: "البريد الإلكتروني", icon: Mail, color: "text-purple-500" },
];

function SecretInput({ label, value, onChange, placeholder, dir = "ltr" }: any) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <div className="relative">
        <Input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} dir={dir} className="pl-10" />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${enabled ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
      {enabled ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {enabled ? "مفعّل" : "غير مفعّل"}
    </span>
  );
}

interface Props { initialTab?: Tab }

export default function AdminNotifications({ initialTab = "telegram" }: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testEmail, setTestEmail] = useState("");

  // Form states
  const [tgToken, setTgToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waApiUrl, setWaApiUrl] = useState("");
  const [twSid, setTwSid] = useState("");
  const [twToken, setTwToken] = useState("");
  const [emHost, setEmHost] = useState("");
  const [emPort, setEmPort] = useState("587");
  const [emUser, setEmUser] = useState("");
  const [emPass, setEmPass] = useState("");
  const [emFrom, setEmFrom] = useState("");
  const [emName, setEmName] = useState("مؤسسة رفقاء البررة");

  async function load() {
    setLoading(true);
    try {
      const s = await api.get<any>("/notifications/settings");
      setSettings(s);
      setTgChatId(s.telegram?.chat_id || "");
      setWaPhoneId(s.whatsapp?.phone_number_id || "");
      setWaApiUrl(s.whatsapp?.api_url || "");
      setEmHost(s.email?.smtp_host || "");
      setEmPort(String(s.email?.smtp_port || 587));
      setEmUser(s.email?.smtp_user || "");
      setEmFrom(s.email?.from_email || "");
      setEmName(s.email?.from_name || "مؤسسة رفقاء البررة");
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function saveSection(section: string, data: any) {
    setSaving(true);
    try {
      await api.post("/notifications/settings", { section, ...data });
      toast({ title: "✅ تم الحفظ" });
      load();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function setToken(endpoint: string, data: any) {
    setSaving(true);
    try {
      await api.post(endpoint, data);
      toast({ title: "✅ تم حفظ البيانات السرية" });
      load();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function testSend(endpoint: string, body?: any) {
    setTesting(true);
    try {
      const res = await api.post<any>(endpoint, body || {});
      toast({ title: res.message || "✅ تم الإرسال بنجاح" });
    } catch (e: any) { toast({ title: "فشل الاختبار", description: e.message, variant: "destructive" }); }
    finally { setTesting(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  const s = settings || {};

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold font-display flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" /> الإشعارات والتواصل
        </h2>
        <p className="text-sm text-muted-foreground mt-1">إعداد قنوات الإشعارات التلقائية للمتبرعين والفريق</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-2xl p-1 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${tab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className={`w-4 h-4 ${tab === t.id ? t.color : ""}`} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

          {/* ─── TELEGRAM ─── */}
          {tab === "telegram" && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <BotMessageSquare className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-bold">تيليجرام بوت</h3>
                      <p className="text-xs text-muted-foreground">إشعارات فورية لكل التبرعات والعمليات</p>
                    </div>
                  </div>
                  <StatusBadge enabled={s.telegram?.enabled} />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 text-sm space-y-1 border border-blue-100 dark:border-blue-900/30">
                  <p className="font-bold text-blue-800 dark:text-blue-300">كيفية الإعداد:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400 text-xs">
                    <li>افتح تيليجرام وابحث عن <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">@BotFather</code></li>
                    <li>أرسل <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/newbot</code> واتبع التعليمات</li>
                    <li>انسخ الـ Bot Token وضعه هنا</li>
                    <li>أضف البوت لمجموعتك، ثم ابحث عن الـ Chat ID</li>
                  </ol>
                </div>

                <div className="grid gap-3">
                  <SecretInput label="Bot Token *" value={tgToken} onChange={setTgToken} placeholder="123456789:AAF..." />
                  <div>
                    <label className="text-sm font-medium mb-1 block">Chat ID *</label>
                    <Input value={tgChatId} onChange={e => setTgChatId(e.target.value)} placeholder="-100123456789" dir="ltr" />
                    <p className="text-xs text-muted-foreground mt-1">رقم المجموعة أو القناة (يبدأ بـ - للمجموعات)</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setToken("/notifications/telegram/set-token", { bot_token: tgToken, chat_id: tgChatId })} disabled={saving || !tgToken} className="flex-1 gap-2">
                    <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ البيانات السرية"}
                  </Button>
                </div>
              </div>

              {/* Notification triggers */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2"><Settings2 className="w-4 h-4 text-muted-foreground" /> أحداث الإشعار</h3>
                {[
                  { key: "enabled", label: "تفعيل إشعارات تيليجرام", desc: "تفعيل أو إيقاف الإشعارات بالكامل" },
                  { key: "on_new_donation", label: "تبرع جديد", desc: "إشعار عند وصول أي تبرع جديد" },
                  { key: "on_approved", label: "اعتماد تبرع", desc: "إشعار عند اعتماد التبرع" },
                  { key: "on_rejected", label: "رفض تبرع", desc: "إشعار عند رفض تبرع" },
                  { key: "on_agent_register", label: "تسجيل مندوب", desc: "إشعار عند تسجيل مندوب ميداني جديد" },
                  { key: "on_field_order", label: "طلب تحصيل", desc: "إشعار عند طلب تحصيل منزلي جديد" },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <input type="checkbox" checked={!!s.telegram?.[item.key]}
                      onChange={e => saveSection("telegram", { [item.key]: e.target.checked })}
                      className="w-5 h-5 rounded accent-primary" />
                  </label>
                ))}
              </div>

              {/* Test */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
                <h3 className="font-bold flex items-center gap-2"><TestTube2 className="w-4 h-4 text-amber-500" /> اختبار الإرسال</h3>
                <Button onClick={() => testSend("/notifications/telegram/test")} disabled={testing || !s.telegram?.bot_token_set}
                  variant="outline" className="w-full gap-2">
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {testing ? "جاري الإرسال..." : "إرسال رسالة اختبار"}
                </Button>
              </div>
            </div>
          )}

          {/* ─── WHATSAPP ─── */}
          {tab === "whatsapp" && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-bold">واتساب Business API</h3>
                      <p className="text-xs text-muted-foreground">رسائل شكر وتأكيد للمتبرعين</p>
                    </div>
                  </div>
                  <StatusBadge enabled={s.whatsapp?.enabled} />
                </div>

                <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 text-sm border border-green-100 dark:border-green-900/30">
                  <p className="font-bold text-green-800 dark:text-green-300 mb-1">يتطلب:</p>
                  <p className="text-xs text-green-700 dark:text-green-400">حساب Meta Business Suite + WhatsApp Business API مفعّل. يمكن استخدام مزودين مثل UltraMsg أو WaAPI بدلاً من Meta مباشرة.</p>
                </div>

                <div className="grid gap-3">
                  <SecretInput label="Access Token *" value={waToken} onChange={setWaToken} placeholder="EAAG..." />
                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone Number ID *</label>
                    <Input value={waPhoneId} onChange={e => setWaPhoneId(e.target.value)} placeholder="100123456789" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">API URL (اختياري)</label>
                    <Input value={waApiUrl} onChange={e => setWaApiUrl(e.target.value)} placeholder="https://graph.facebook.com/v18.0/{phone_id}/messages" dir="ltr" />
                    <p className="text-xs text-muted-foreground mt-1">اتركه فارغاً لاستخدام Meta API الافتراضي</p>
                  </div>
                </div>
                <Button onClick={() => setToken("/notifications/whatsapp/set-token", { token: waToken, phone_number_id: waPhoneId, api_url: waApiUrl })}
                  disabled={saving || !waToken} className="w-full gap-2">
                  <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ إعدادات واتساب"}
                </Button>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2"><Settings2 className="w-4 h-4 text-muted-foreground" /> أحداث الإرسال</h3>
                {[
                  { key: "enabled", label: "تفعيل واتساب", desc: "إرسال رسائل واتساب" },
                  { key: "send_thank_you", label: "رسالة شكر بعد الاعتماد", desc: "إرسال رسالة شكر للمتبرع عند اعتماد تبرعه" },
                  { key: "send_confirmation", label: "تأكيد الاستلام", desc: "إرسال تأكيد فوري عند وصول التبرع" },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <input type="checkbox" checked={!!s.whatsapp?.[item.key]}
                      onChange={e => saveSection("whatsapp", { [item.key]: e.target.checked })}
                      className="w-5 h-5 rounded accent-primary" />
                  </label>
                ))}

                <div>
                  <label className="text-sm font-medium mb-1 block">نص رسالة الشكر</label>
                  <textarea value={s.whatsapp?.thank_you_template || ""}
                    onChange={e => saveSection("whatsapp", { thank_you_template: e.target.value })}
                    rows={4} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                    placeholder="شكراً يا {name}! تبرعك بـ {amount} ج سيغير حياة كثيرين. رقم عمليتك: {refqa_id}" />
                  <p className="text-xs text-muted-foreground mt-1">المتغيرات: &#123;name&#125;, &#123;amount&#125;, &#123;refqa_id&#125;, &#123;campaign&#125;</p>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
                <h3 className="font-bold flex items-center gap-2"><TestTube2 className="w-4 h-4 text-amber-500" /> اختبار الإرسال</h3>
                <div>
                  <label className="text-sm font-medium mb-1 block">رقم الهاتف (مثال: 201123456789)</label>
                  <Input value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="201123456789" dir="ltr" />
                </div>
                <Button onClick={() => testSend("/notifications/whatsapp/test", { test_phone: testPhone })}
                  disabled={testing || !s.whatsapp?.token_set || !testPhone} variant="outline" className="w-full gap-2">
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {testing ? "جاري الإرسال..." : "إرسال رسالة اختبار"}
                </Button>
              </div>
            </div>
          )}

          {/* ─── TWILIO ─── */}
          {tab === "twilio" && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold">Twilio SMS</h3>
                      <p className="text-xs text-muted-foreground">رسائل SMS باسمك الخاص للمتبرعين</p>
                    </div>
                  </div>
                  <StatusBadge enabled={s.twilio?.enabled} />
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 text-sm border border-red-100 dark:border-red-900/30">
                  <p className="font-bold text-red-800 dark:text-red-300 mb-1">إنشاء حساب Twilio:</p>
                  <p className="text-xs text-red-700 dark:text-red-400">اشترك على <span className="font-mono">twilio.com</span> واحصل على Account SID + Auth Token. يمكن إرسال SMS باسم مؤسستك كـ Sender ID.</p>
                </div>

                <div className="grid gap-3">
                  <SecretInput label="Account SID *" value={twSid} onChange={setTwSid} placeholder="ACxxxxxxxxxxxxxxxx" />
                  <SecretInput label="Auth Token *" value={twToken} onChange={setTwToken} placeholder="xxxxxx..." />
                  <div>
                    <label className="text-sm font-medium mb-1 block">رقم المرسل / Sender ID</label>
                    <Input value={s.twilio?.from_number || ""} onChange={e => saveSection("twilio", { from_number: e.target.value })} placeholder="+12025551234 أو رفقاء" dir="ltr" />
                    <p className="text-xs text-muted-foreground mt-1">رقم Twilio أو اسم المرسل (Alphanumeric)</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">اسم المرسل المعروض</label>
                    <Input value={s.twilio?.from_name || ""} onChange={e => saveSection("twilio", { from_name: e.target.value })} placeholder="رفقاء البررة" />
                  </div>
                </div>
                <Button onClick={() => setToken("/notifications/twilio/set-credentials", { account_sid: twSid, auth_token: twToken })}
                  disabled={saving || !twSid || !twToken} className="w-full gap-2">
                  <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ بيانات Twilio"}
                </Button>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-bold">إعدادات الإرسال</h3>
                {[
                  { key: "enabled", label: "تفعيل Twilio SMS" },
                  { key: "send_sms_on_approve", label: "SMS عند اعتماد التبرع" },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium">{item.label}</span>
                    <input type="checkbox" checked={!!s.twilio?.[item.key]}
                      onChange={e => saveSection("twilio", { [item.key]: e.target.checked })}
                      className="w-5 h-5 rounded accent-primary" />
                  </label>
                ))}
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
                <h3 className="font-bold flex items-center gap-2"><TestTube2 className="w-4 h-4 text-amber-500" /> اختبار SMS</h3>
                <div>
                  <label className="text-sm font-medium mb-1 block">رقم الهاتف للاختبار</label>
                  <Input value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="+201123456789" dir="ltr" />
                </div>
                <Button onClick={() => testSend("/notifications/twilio/test", { test_phone: testPhone })}
                  disabled={testing || !s.twilio?.account_sid_set || !testPhone} variant="outline" className="w-full gap-2">
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {testing ? "جاري الإرسال..." : "إرسال SMS تجريبي"}
                </Button>
              </div>
            </div>
          )}

          {/* ─── EMAIL ─── */}
          {tab === "email" && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-bold">البريد الإلكتروني SMTP</h3>
                      <p className="text-xs text-muted-foreground">إيميلات تأكيد وشكر واستعادة كلمة مرور</p>
                    </div>
                  </div>
                  <StatusBadge enabled={s.email?.enabled} />
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 text-sm border border-purple-100 dark:border-purple-900/30 space-y-1">
                  <p className="font-bold text-purple-800 dark:text-purple-300">SMTP الدومين الخاص:</p>
                  <div className="text-xs text-purple-700 dark:text-purple-400 space-y-0.5">
                    <p>• Gmail: smtp.gmail.com | Port: 587</p>
                    <p>• cPanel/Namecheap: mail.yourdomain.com | Port: 465 (SSL)</p>
                    <p>• Outlook: smtp-mail.outlook.com | Port: 587</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">SMTP Host *</label>
                      <Input value={emHost} onChange={e => setEmHost(e.target.value)} placeholder="mail.rafaqaa.org" dir="ltr" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Port *</label>
                      <Input type="number" value={emPort} onChange={e => setEmPort(e.target.value)} placeholder="587" dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">اسم المستخدم (البريد) *</label>
                    <Input value={emUser} onChange={e => setEmUser(e.target.value)} placeholder="info@rafaqaa.org" dir="ltr" />
                  </div>
                  <SecretInput label="كلمة مرور البريد *" value={emPass} onChange={setEmPass} placeholder="••••••••" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">بريد المرسل</label>
                      <Input value={emFrom} onChange={e => setEmFrom(e.target.value)} placeholder="info@rafaqaa.org" dir="ltr" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">اسم المرسل</label>
                      <Input value={emName} onChange={e => setEmName(e.target.value)} placeholder="مؤسسة رفقاء البررة" />
                    </div>
                  </div>
                </div>

                <Button onClick={() => setToken("/notifications/email/set-credentials", { smtp_host: emHost, smtp_port: Number(emPort), smtp_user: emUser, smtp_pass: emPass, from_email: emFrom, from_name: emName })}
                  disabled={saving || !emHost || !emUser || !emPass} className="w-full gap-2">
                  <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ إعدادات البريد"}
                </Button>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-bold">أحداث البريد</h3>
                {[
                  { key: "enabled", label: "تفعيل البريد الإلكتروني" },
                  { key: "send_on_approve", label: "إيميل شكر عند اعتماد التبرع" },
                  { key: "send_on_register", label: "إيميل ترحيب عند التسجيل" },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium">{item.label}</span>
                    <input type="checkbox" checked={!!s.email?.[item.key]}
                      onChange={e => saveSection("email", { [item.key]: e.target.checked })}
                      className="w-5 h-5 rounded accent-primary" />
                  </label>
                ))}
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
                <h3 className="font-bold flex items-center gap-2"><TestTube2 className="w-4 h-4 text-amber-500" /> اختبار البريد</h3>
                <div>
                  <label className="text-sm font-medium mb-1 block">البريد الإلكتروني للاختبار</label>
                  <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" dir="ltr" />
                </div>
                <Button onClick={() => testSend("/notifications/email/test", { test_email: testEmail })}
                  disabled={testing || !s.email?.smtp_pass_set || !testEmail} variant="outline" className="w-full gap-2">
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {testing ? "جاري الإرسال..." : "إرسال إيميل اختبار"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
