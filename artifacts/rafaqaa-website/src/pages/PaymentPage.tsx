import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "";

interface PaymentStatus {
  id: string;
  refqa_id: string;
  status: "pending" | "approved" | "rejected";
  amount: number;
  donor_name: string;
  campaign_title?: string;
  confirmed_at?: string;
  created_at: string;
}

export default function PaymentPage() {
  const [params] = useSearchParams();
  const refqaId = params.get("refqa_id") ?? params.get("id") ?? "";
  const isDemo = params.get("demo") === "1";
  const previewAmount = params.get("amount") ?? "100";
  const previewName = params.get("name") ?? "اختبار";
  const paymentUrl = params.get("payment_url") ?? "";

  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(!!refqaId && !isDemo);
  const [confirming, setConfirming] = useState(false);
  const [showIframe, setShowIframe] = useState(!!paymentUrl);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    if (!refqaId || isDemo) return;
    try {
      const r = await fetch(`${API}/api/payments/status/${refqaId}`);
      if (r.ok) {
        const data = await r.json();
        setStatus(data);
      }
    } finally {
      setLoading(false);
    }
  }, [refqaId, isDemo]);

  useEffect(() => {
    fetchStatus();
    // Poll every 3 seconds if pending
    const interval = setInterval(() => {
      if (status?.status === "pending") fetchStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus, status?.status]);

  async function confirmDemo() {
    setConfirming(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/payments/demo/confirm/${refqaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await r.json();
      if (r.ok) {
        fetchStatus();
      } else {
        setError(data.message || "حدث خطأ");
      }
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setConfirming(false);
    }
  }

  // ── If showing real payment iframe ────────────────────
  if (paymentUrl && showIframe && !status) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">إتمام الدفع الآمن</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{refqaId}</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  اتصال آمن (SSL)
                </div>
              </div>
              <iframe src={paymentUrl} className="w-full" style={{ height: "600px" }} title="نافذة الدفع" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Demo test page (no refqaId) ───────────────────────
  if (isDemo && !refqaId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <DemoPaymentCard
              amount={Number(previewAmount)}
              donorName={previewName}
              refqaId="Refqa-DEMO-0001"
              onConfirm={() => {}}
              confirming={false}
              isDemo
              noAction
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">جاري التحقق من حالة الدفع...</p>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────
  if (status?.status === "approved") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">تم الدفع بنجاح!</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">جزاك الله خيراً — تبرعك وصل بسلام</p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2 text-sm text-right">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">رقم العملية</span>
                  <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">{status.refqa_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">المتبرع</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{status.donor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">المبلغ</span>
                  <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400">{Number(status.amount).toLocaleString("ar-EG")} ج.م</span>
                </div>
                {status.campaign_title && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">الحملة</span>
                    <span className="text-gray-800 dark:text-white">{status.campaign_title}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">وقت التأكيد</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {new Date(status.confirmed_at || status.created_at).toLocaleString("ar-EG")}
                  </span>
                </div>
              </div>

              <a href="/"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors w-full justify-center">
                العودة للصفحة الرئيسية
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Rejected ──────────────────────────────────────────
  if (status?.status === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">لم يتم الدفع</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-2">رقم العملية: <span className="font-mono text-red-600">{status.refqa_id}</span></p>
              <p className="text-gray-500 dark:text-gray-400 mb-6">يرجى المحاولة مرة أخرى أو اختيار طريقة دفع مختلفة</p>
              <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors w-full justify-center">
                المحاولة مرة أخرى
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending (demo or waiting for webhook) ─────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {status && (
            <DemoPaymentCard
              amount={Number(status.amount)}
              donorName={status.donor_name}
              refqaId={status.refqa_id}
              campaignTitle={status.campaign_title}
              onConfirm={confirmDemo}
              confirming={confirming}
              error={error}
              isDemo={status.status === "pending"}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">🌿</span>
        </div>
        <div>
          <p className="font-bold text-gray-800 dark:text-white text-sm">رفقاء البررة</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">بوابة الدفع الآمنة</p>
        </div>
        <div className="mr-auto flex items-center gap-1 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          مدفوعات آمنة ومشفرة
        </div>
      </div>
    </header>
  );
}

interface DemoCardProps {
  amount: number;
  donorName: string;
  refqaId: string;
  campaignTitle?: string;
  onConfirm: () => void;
  confirming: boolean;
  error?: string;
  isDemo?: boolean;
  noAction?: boolean;
}

function DemoPaymentCard({ amount, donorName, refqaId, campaignTitle, onConfirm, confirming, error, isDemo, noAction }: DemoCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top accent */}
      <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />

      <div className="p-8">
        {isDemo && (
          <div className="mb-6 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400 text-center">
            🧪 وضع تجريبي — لا تتم معاملات حقيقية
          </div>
        )}

        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي التبرع</p>
          <p className="text-5xl font-bold text-gray-800 dark:text-white">
            {amount.toLocaleString("ar-EG")}
            <span className="text-2xl text-gray-400 mr-1">ج.م</span>
          </p>
          {campaignTitle && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">{campaignTitle}</p>
          )}
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">المتبرع</span>
            <span className="font-semibold text-gray-800 dark:text-white">{donorName}</span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">رقم العملية</span>
            <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">{refqaId}</span>
          </div>
          <div className="flex justify-between text-sm py-2">
            <span className="text-gray-500 dark:text-gray-400">الحالة</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              في انتظار الدفع
            </span>
          </div>
        </div>

        {/* Demo card visual */}
        <div className="mb-6 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 p-4 text-white h-28 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <p className="text-xs text-gray-400 mb-3">بطاقة اختبار</p>
          <p className="font-mono text-lg tracking-widest">4111 1111 1111 1111</p>
          <div className="flex gap-4 mt-2">
            <p className="text-xs text-gray-400">انتهاء: 12/25</p>
            <p className="text-xs text-gray-400">CVV: 123</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!noAction && (
          <button onClick={onConfirm} disabled={confirming}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-3">
            {confirming ? (
              <>
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                جاري التأكيد...
              </>
            ) : (
              <>
                🧪 تأكيد الدفع التجريبي
              </>
            )}
          </button>
        )}

        {noAction && (
          <div className="w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-xl font-bold text-lg text-center">
            معاينة فقط
          </div>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          🔒 هذه الصفحة للاختبار فقط — لن يُخصم أي مبلغ حقيقي
        </p>
      </div>
    </div>
  );
}
