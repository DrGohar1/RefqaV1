import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Clock, CheckCircle2, XCircle, BarChart3, Search,
  RefreshCw, Loader2, ChevronDown, Filter, TrendingUp, Banknote,
  Eye, AlertCircle, Download, Calendar, ArrowUpRight, Hash,
  User, Phone, Badge, CheckCheck, X as XIcon
} from "lucide-react";

type GatewayTab = "all" | "pending" | "approved" | "rejected" | "reports";

interface Donation {
  id: string;
  donor_name: string;
  donor_phone: string;
  donor_email?: string;
  campaign_title?: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  payment_method: string;
  operation_id?: string;
  refqa_id?: string;
  gateway_transaction_id?: string;
  confirmed_at?: string;
  created_at: string;
  notes?: string;
}

const TABS: { id: GatewayTab; label: string; icon: any; color: string }[] = [
  { id: "all", label: "كل العمليات", icon: CreditCard, color: "text-primary" },
  { id: "pending", label: "قيد المراجعة", icon: Clock, color: "text-amber-500" },
  { id: "approved", label: "المعتمدة", icon: CheckCircle2, color: "text-green-500" },
  { id: "rejected", label: "المرفوضة", icon: XCircle, color: "text-red-500" },
  { id: "reports", label: "التقارير المالية", icon: BarChart3, color: "text-blue-500" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    pending: { label: "قيد المراجعة", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    approved: { label: "معتمد", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    rejected: { label: "مرفوض", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  };
  const s = map[status] || { label: status, class: "bg-muted text-muted-foreground" };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.class}`}>{s.label}</span>;
}

function PaymentMethodBadge({ method }: { method: string }) {
  const labels: Record<string, string> = {
    online_card: "بطاقة بنكية",
    online_wallet: "محفظة إلكترونية",
    online_demo: "تجريبي",
    wallet: "محفظة",
    instapay: "انستاباي",
    bank_transfer: "تحويل بنكي",
    vodafone_cash: "فودافون كاش",
    cash: "نقداً",
    field_collection: "تحصيل منزلي",
  };
  return <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{labels[method] || method}</span>;
}

function DonationRow({ d, onApprove, onReject, onView, processing }: {
  d: Donation; onApprove: () => void; onReject: () => void; onView: () => void; processing: boolean;
}) {
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="p-3 text-xs font-mono text-muted-foreground">{d.refqa_id || d.operation_id || "—"}</td>
      <td className="p-3">
        <div>
          <p className="text-sm font-medium">{d.donor_name}</p>
          <p className="text-xs text-muted-foreground">{d.donor_phone}</p>
        </div>
      </td>
      <td className="p-3 text-sm font-bold text-primary">{Number(d.amount).toLocaleString("ar-EG")} ج</td>
      <td className="p-3"><PaymentMethodBadge method={d.payment_method} /></td>
      <td className="p-3"><StatusBadge status={d.status} /></td>
      <td className="p-3 text-xs text-muted-foreground">
        {new Date(d.created_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </td>
      <td className="p-3">
        <div className="flex gap-1">
          <button onClick={onView} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="تفاصيل">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {d.status === "pending" && (
            <>
              <button onClick={onApprove} disabled={processing}
                className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" title="اعتماد">
                <CheckCheck className="w-3.5 h-3.5 text-green-600" />
              </button>
              <button onClick={onReject} disabled={processing}
                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="رفض">
                <XIcon className="w-3.5 h-3.5 text-red-500" />
              </button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

function DetailModal({ d, onClose, onApprove, onReject, processing }: {
  d: Donation; onClose: () => void; onApprove: (notes: string) => void; onReject: (notes: string) => void; processing: boolean;
}) {
  const [notes, setNotes] = useState("");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg space-y-4 shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">تفاصيل العملية</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><XIcon className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Hash, label: "رقم Refqa", val: d.refqa_id || "—" },
            { icon: Badge, label: "رقم العملية", val: d.operation_id || d.gateway_transaction_id || "—" },
            { icon: User, label: "اسم المتبرع", val: d.donor_name },
            { icon: Phone, label: "الهاتف", val: d.donor_phone },
            { icon: Banknote, label: "المبلغ", val: `${Number(d.amount).toLocaleString("ar-EG")} جنيه` },
            { icon: CreditCard, label: "طريقة الدفع", val: d.payment_method },
            { icon: Calendar, label: "تاريخ التبرع", val: new Date(d.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) },
            { icon: AlertCircle, label: "الحالة", val: d.status === "approved" ? "معتمد ✅" : d.status === "rejected" ? "مرفوض ❌" : "قيد المراجعة ⏳" },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="bg-muted/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{label}</span>
              </div>
              <p className="text-sm font-medium break-all">{val}</p>
            </div>
          ))}
        </div>

        {d.campaign_title && (
          <div className="bg-primary/5 rounded-xl p-3 text-sm">
            <span className="text-muted-foreground text-xs">الحملة: </span>
            <span className="font-medium">{d.campaign_title}</span>
          </div>
        )}

        {d.donor_email && (
          <div className="text-sm text-muted-foreground">البريد: <span className="text-foreground">{d.donor_email}</span></div>
        )}

        {d.status === "pending" && (
          <div className="space-y-3 pt-2 border-t border-border">
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
              rows={2} placeholder="ملاحظات (اختياري)..." />
            <div className="flex gap-2">
              <Button onClick={() => onApprove(notes)} disabled={processing} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                اعتماد التبرع
              </Button>
              <Button onClick={() => onReject(notes)} disabled={processing} variant="destructive" className="flex-1 gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XIcon className="w-4 h-4" />}
                رفض
              </Button>
            </div>
          </div>
        )}

        {d.confirmed_at && (
          <p className="text-xs text-muted-foreground">تم التأكيد: {new Date(d.confirmed_at).toLocaleString("ar-EG")}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

function ReportsTab({ donations }: { donations: Donation[] }) {
  const approved = donations.filter(d => d.status === "approved");
  const pending = donations.filter(d => d.status === "pending");
  const rejected = donations.filter(d => d.status === "rejected");
  const totalRaised = approved.reduce((s, d) => s + Number(d.amount), 0);
  const totalPending = pending.reduce((s, d) => s + Number(d.amount), 0);
  const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

  const byMethod: Record<string, { count: number; total: number }> = {};
  approved.forEach(d => {
    const m = d.payment_method;
    if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 };
    byMethod[m].count++;
    byMethod[m].total += Number(d.amount);
  });

  const byDay: Record<string, number> = {};
  approved.forEach(d => {
    const day = d.created_at.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + Number(d.amount);
  });
  const sortedDays = Object.entries(byDay).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7);

  const methodLabels: Record<string, string> = {
    online_card: "بطاقة بنكية", online_wallet: "محفظة إلكترونية", online_demo: "تجريبي",
    wallet: "محفظة", instapay: "انستاباي", bank_transfer: "تحويل بنكي",
    vodafone_cash: "فودافون كاش", cash: "نقداً", field_collection: "تحصيل منزلي",
  };

  const conversionRate = donations.length ? Math.round((approved.length / donations.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المحصّل", val: `${fmt(totalRaised)} ج`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/10" },
          { label: "قيد التحصيل", val: `${fmt(totalPending)} ج`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10" },
          { label: "معدل التحويل", val: `${conversionRate}%`, icon: ArrowUpRight, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10" },
          { label: "متوسط التبرع", val: `${fmt(approved.length ? Math.round(totalRaised / approved.length) : 0)} ج`, icon: Banknote, color: "text-primary", bg: "bg-primary/5" },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-border`}>
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className={`text-xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* By payment method */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-bold text-sm">توزيع طرق الدفع (المعتمدة)</h3>
          {Object.entries(byMethod).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد عمليات معتمدة</p>
          ) : (
            Object.entries(byMethod).map(([method, { count, total }]) => {
              const pct = totalRaised ? Math.round((total / totalRaised) * 100) : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{methodLabels[method] || method}</span>
                    <span className="font-bold">{fmt(total)} ج ({count})</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Daily totals */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-bold text-sm">آخر 7 أيام (المعتمدة)</h3>
          {sortedDays.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {sortedDays.map(([day, total]) => {
                const maxDay = Math.max(...sortedDays.map(([, v]) => v));
                const pct = maxDay ? Math.round((total / maxDay) * 100) : 0;
                return (
                  <div key={day} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{new Date(day).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}</span>
                      <span className="font-bold">{fmt(total)} ج</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-bold text-sm mb-4">ملخص الحالات</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "معتمدة", count: approved.length, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/10" },
            { label: "قيد المراجعة", count: pending.length, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10" },
            { label: "مرفوضة", count: rejected.length, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/10" },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-4`}>
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props { initialTab?: GatewayTab }

export default function AdminPaymentGateway({ initialTab = "all" }: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState<GatewayTab>(initialTab);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Donation | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (tab !== "all" && tab !== "reports") params.status = tab;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const qs = new URLSearchParams(params).toString();
      const data = await api.get<Donation[]>(`/donations${qs ? "?" + qs : ""}`);
      setDonations(data || []);
    } catch (e: any) { toast({ title: "خطأ في التحميل", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }, [tab, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  async function approve(d: Donation, notes?: string) {
    setProcessing(d.id);
    try {
      await api.patch(`/donations/${d.id}/status`, { status: "approved", notes });
      toast({ title: "✅ تم اعتماد التبرع", description: `رقم العملية: ${d.refqa_id || d.id}` });
      setSelected(null);
      load();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setProcessing(null); }
  }

  async function reject(d: Donation, notes?: string) {
    setProcessing(d.id);
    try {
      await api.patch(`/donations/${d.id}/status`, { status: "rejected", notes });
      toast({ title: "تم رفض التبرع", variant: "destructive" });
      setSelected(null);
      load();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setProcessing(null); }
  }

  const filtered = donations.filter(d => {
    const q = search.toLowerCase();
    return !q || d.donor_name.toLowerCase().includes(q) || d.donor_phone.includes(q) ||
      (d.refqa_id || "").toLowerCase().includes(q) || (d.operation_id || "").toLowerCase().includes(q) ||
      (d.gateway_transaction_id || "").toLowerCase().includes(q);
  });

  const pendingCount = donations.filter(d => d.status === "pending").length;

  function exportCSV() {
    const headers = ["refqa_id", "donor_name", "donor_phone", "campaign_title", "amount", "status", "payment_method", "gateway_transaction_id", "created_at"];
    const rows = filtered.map(d => headers.map(h => `"${((d as any)[h] || "").toString().replace(/"/g, '""')}"`).join(","));
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `gateway_report_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> بوابة الدفع الإلكتروني
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">مراجعة واعتماد العمليات الإلكترونية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter className="w-4 h-4" /> تصفية
            {showFilters && <ChevronDown className="w-3 h-3 rotate-180" />}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" /> تصدير CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-card rounded-xl border border-border p-4 grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">بحث</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="اسم، هاتف، Refqa..." className="pr-9" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">من تاريخ</label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} dir="ltr" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">إلى تاريخ</label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} dir="ltr" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-2xl p-1 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all relative flex-1 justify-center ${tab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className={`w-4 h-4 ${tab === t.id ? t.color : ""}`} />
            <span className="hidden sm:inline">{t.label}</span>
            {t.id === "pending" && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reports tab */}
      {tab === "reports" && <ReportsTab donations={donations} />}

      {/* Transactions table */}
      {tab !== "reports" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>لا توجد عمليات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <th className="p-3 font-medium">رقم Refqa</th>
                    <th className="p-3 font-medium">المتبرع</th>
                    <th className="p-3 font-medium">المبلغ</th>
                    <th className="p-3 font-medium">طريقة الدفع</th>
                    <th className="p-3 font-medium">الحالة</th>
                    <th className="p-3 font-medium">التاريخ</th>
                    <th className="p-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <DonationRow key={d.id} d={d}
                      onApprove={() => approve(d)}
                      onReject={() => reject(d)}
                      onView={() => setSelected(d)}
                      processing={processing === d.id}
                    />
                  ))}
                </tbody>
              </table>
              <div className="p-3 border-t border-border text-xs text-muted-foreground text-left">
                {filtered.length} عملية • إجمالي: {new Intl.NumberFormat("ar-EG").format(filtered.reduce((s, d) => s + Number(d.amount), 0))} ج
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal d={selected} onClose={() => setSelected(null)}
            onApprove={(notes) => approve(selected, notes)}
            onReject={(notes) => reject(selected, notes)}
            processing={!!processing} />
        )}
      </AnimatePresence>
    </div>
  );
}
