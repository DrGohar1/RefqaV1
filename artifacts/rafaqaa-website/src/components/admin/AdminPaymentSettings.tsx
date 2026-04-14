import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL ?? "";

interface PaymentStatus {
  id?: string;
  provider?: string;
  is_active?: boolean;
  test_mode?: boolean;
  label?: string;
  notes?: string;
  has_api_key?: boolean;
  has_integration_card?: boolean;
  has_iframe_card?: boolean;
  has_integration_wallet?: boolean;
  has_iframe_wallet?: boolean;
  has_fawry?: boolean;
  has_hmac?: boolean;
  api_key_masked?: string;
  configured?: boolean;
  updated_at?: string;
}

export default function AdminPaymentSettings() {
  const [status, setStatus] = useState<PaymentStatus>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"paymob" | "fawry" | "general">("paymob");

  const [form, setForm] = useState({
    provider: "paymob",
    is_active: false,
    test_mode: true,
    label: "بوابة الدفع الإلكتروني",
    notes: "",
    api_key: "",
    integration_id_card: "",
    iframe_id_card: "",
    integration_id_wallet: "",
    iframe_id_wallet: "",
    fawry_merchant_code: "",
    fawry_security_key: "",
    hmac_secret: "",
  });

  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => { fetchStatus(); }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/payment-settings`, { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setStatus(data);
        setForm(f => ({
          ...f,
          provider: data.provider ?? "paymob",
          is_active: data.is_active ?? false,
          test_mode: data.test_mode ?? true,
          label: data.label ?? "بوابة الدفع الإلكتروني",
          notes: data.notes ?? "",
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload: any = { ...form };
      // Remove empty keys so we don't overwrite with empty string
      if (!payload.api_key) delete payload.api_key;
      if (!payload.hmac_secret) delete payload.hmac_secret;

      const r = await fetch(`${API}/api/payment-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (r.ok) {
        setMsg({ text: data.message || "تم الحفظ", type: "success" });
        setForm(f => ({ ...f, api_key: "", hmac_secret: "" })); // Clear sensitive fields from form
        fetchStatus();
      } else {
        setMsg({ text: data.message || "حدث خطأ", type: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleClearKeys() {
    if (!confirm("هل تريد مسح جميع مفاتيح API؟ سيتوقف الدفع الإلكتروني.")) return;
    const r = await fetch(`${API}/api/payment-settings/keys`, { method: "DELETE", credentials: "include" });
    if (r.ok) {
      setMsg({ text: "تم مسح مفاتيح API — بوابة الدفع الآن في وضع تجريبي", type: "success" });
      fetchStatus();
    }
  }

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );

  const isLive = status.is_active && status.has_api_key && !status.test_mode;
  const isTestActive = status.is_active && status.test_mode;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">إعدادات بوابة الدفع</h2>
          <p className="text-gray-500 text-sm mt-1">إدارة وتكوين بوابة الدفع الإلكتروني</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
          isLive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : isTestActive ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        }`}>
          {isLive ? "🟢 لايف — حقيقي" : isTestActive ? "🟡 وضع تجريبي" : "🔴 غير مفعّل"}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "المزود", value: status.provider === "paymob" ? "Paymob" : status.provider === "fawry" ? "فوري" : "تجريبي", icon: "🏦" },
          { label: "مفتاح API", value: status.has_api_key ? status.api_key_masked : "غير محدد", icon: "🔑" },
          { label: "بطاقة ائتمان", value: status.has_integration_card && status.has_iframe_card ? "✅ مكتمل" : "❌ ناقص", icon: "💳" },
          { label: "HMAC", value: status.has_hmac ? "✅ محمي" : "⚠️ بدون توقيع", icon: "🔐" },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{card.label}</div>
            <div className="text-sm font-semibold text-gray-800 dark:text-white mt-0.5 truncate">{card.value || "—"}</div>
          </div>
        ))}
      </div>

      {/* Alert message */}
      {msg && (
        <div className={`rounded-xl p-4 text-sm font-medium ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
          : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800"
        }`}>
          {msg.type === "success" ? "✅ " : "❌ "}{msg.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">

        {/* General Settings */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">الإعدادات العامة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">مزود الدفع</label>
              <select value={form.provider} onChange={e => { set("provider", e.target.value); setActiveTab(e.target.value === "fawry" ? "fawry" : "paymob"); }}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                <option value="paymob">Paymob (فيزا / فوري / محافظ)</option>
                <option value="fawry">فوري مباشر</option>
                <option value="demo">تجريبي فقط (بدون دفع حقيقي)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">التسمية في الموقع</label>
              <input type="text" value={form.label} onChange={e => set("label", e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
            </div>
          </div>

          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)}
                className="w-4 h-4 accent-emerald-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">تفعيل بوابة الدفع</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.test_mode} onChange={e => set("test_mode", e.target.checked)}
                className="w-4 h-4 accent-amber-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">وضع تجريبي (Test Mode)</span>
            </label>
          </div>

          {form.test_mode && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
              🧪 <strong>وضع تجريبي مفعّل:</strong> لن تتم معاملات حقيقية — سيظهر زر "تأكيد الدفع التجريبي" في صفحة الدفع
            </div>
          )}
        </div>

        {/* Provider Tabs */}
        {form.provider !== "demo" && (
          <>
            <div className="flex border-b border-gray-100 dark:border-gray-700">
              {form.provider === "paymob" && (
                <>
                  <button type="button" onClick={() => setActiveTab("paymob")}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "paymob" ? "border-b-2 border-emerald-600 text-emerald-700 dark:text-emerald-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                    Paymob API
                  </button>
                </>
              )}
              {form.provider === "fawry" && (
                <button type="button" onClick={() => setActiveTab("fawry")}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "fawry" ? "border-b-2 border-emerald-600 text-emerald-700 dark:text-emerald-400" : "text-gray-500"}`}>
                  إعدادات فوري
                </button>
              )}
              <button type="button" onClick={() => setActiveTab("general")}
                className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "general" ? "border-b-2 border-emerald-600 text-emerald-700 dark:text-emerald-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                أمان (HMAC)
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Paymob Tab */}
              {activeTab === "paymob" && form.provider === "paymob" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">المفاتيح من لوحة تحكم Paymob → Settings → API Keys</p>
                    <button type="button" onClick={() => setShowKeys(!showKeys)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                      {showKeys ? "إخفاء الحقول" : "تعديل المفاتيح"}
                    </button>
                  </div>

                  {status.has_api_key && !showKeys && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      🔑 مفتاح API محفوظ: <code className="font-mono">{status.api_key_masked}</code>
                      <button type="button" onClick={() => setShowKeys(true)} className="mr-auto text-xs text-amber-600 hover:underline">تغيير</button>
                    </div>
                  )}

                  {(!status.has_api_key || showKeys) && (
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                        API Key <span className="text-red-500">*</span>
                      </label>
                      <input type="password" value={form.api_key} onChange={e => set("api_key", e.target.value)}
                        placeholder="ZXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx"
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-mono" />
                    </div>
                  )}

                  <hr className="border-gray-100 dark:border-gray-700" />
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">بطاقة ائتمان (Visa / Mastercard)</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Integration ID — بطاقة</label>
                      <input type="text" value={form.integration_id_card} onChange={e => set("integration_id_card", e.target.value)}
                        placeholder="123456"
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">iFrame ID — بطاقة</label>
                      <input type="text" value={form.iframe_id_card} onChange={e => set("iframe_id_card", e.target.value)}
                        placeholder="78901"
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-gray-700" />
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">محفظة إلكترونية (اختياري)</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Integration ID — محفظة</label>
                      <input type="text" value={form.integration_id_wallet} onChange={e => set("integration_id_wallet", e.target.value)}
                        placeholder="اختياري"
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">iFrame ID — محفظة</label>
                      <input type="text" value={form.iframe_id_wallet} onChange={e => set("iframe_id_wallet", e.target.value)}
                        placeholder="اختياري"
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                    </div>
                  </div>
                </>
              )}

              {/* Fawry Tab */}
              {activeTab === "fawry" && form.provider === "fawry" && (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">المفاتيح من بوابة فوري للمطورين — developer.fawrystaging.com</p>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Merchant Code</label>
                      <input type="text" value={form.fawry_merchant_code} onChange={e => set("fawry_merchant_code", e.target.value)}
                        placeholder="fawry_merchant_XXXXXXX"
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Security Key</label>
                      <input type="password" value={form.fawry_security_key} onChange={e => set("fawry_security_key", e.target.value)}
                        placeholder="••••••••••••••"
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                    </div>
                  </div>
                </>
              )}

              {/* HMAC Security Tab */}
              {activeTab === "general" && (
                <>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-400">
                    <strong>ما هو HMAC؟</strong><br />
                    مفتاح سري يُستخدم للتحقق من أن webhook القادم من Paymob حقيقي وليس مزوّر.
                    تجده في Paymob → Settings → Security Settings → HMAC Secret
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">HMAC Secret Key</label>
                    <input type="password" value={form.hmac_secret} onChange={e => set("hmac_secret", e.target.value)}
                      placeholder="اتركه فارغاً إذا لم يكن مطلوباً"
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">رابط Webhook (للإدخال في Paymob)</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly
                        value={`${API || window.location.origin.replace(/:\d+$/, ":8080")}/api/payments/paymob/callback`}
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400" />
                      <button type="button" onClick={() => navigator.clipboard.writeText(`${API}/api/payments/paymob/callback`)}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">
                        نسخ
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Demo mode info */}
        {form.provider === "demo" && (
          <div className="p-6">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl text-sm text-purple-700 dark:text-purple-400">
              <p className="font-semibold mb-2">🧪 وضع تجريبي بالكامل</p>
              <p>في هذا الوضع:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>لن يُطلب من المتبرع أي بيانات بطاقة حقيقية</li>
                <li>ستظهر صفحة دفع تجريبية مع زر "تأكيد الدفع"</li>
                <li>بعد الضغط يُسجَّل التبرع كـ Refqa-XXXXXX في النظام</li>
                <li>مثالي لاختبار تدفق العمل قبل الإنتاج</li>
              </ul>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">ملاحظات داخلية</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
            placeholder="ملاحظات للفريق الداخلي فقط"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button type="button" onClick={handleClearKeys}
            className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors">
            مسح مفاتيح API
          </button>
          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2">
            {saving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : "💾"}
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </form>

      {/* Test Payment Button */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">🧪 اختبار الدفع</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">اختبر صفحة الدفع مباشرة من هنا</p>
        <a href="/pay?demo=1&amount=100&name=اختبار" target="_blank"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors">
          🔗 فتح صفحة الدفع التجريبية
        </a>
      </div>
    </div>
  );
}
