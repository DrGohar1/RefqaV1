import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, Clock, XCircle, Phone, Hash, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";

interface Donation {
  id: string;
  refqa_id: string;
  operation_id?: string;
  donor_name: string;
  donor_phone: string;
  amount: number;
  campaign_title?: string;
  payment_method: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  confirmed_at?: string;
  notes?: string;
}

const statusConfig = {
  approved: { label: "تم الاعتماد ✅", color: "bg-green-500/10 text-green-600 border-green-500/30", icon: CheckCircle2, iconColor: "text-green-500" },
  pending: { label: "قيد المراجعة ⏳", color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock, iconColor: "text-amber-500" },
  rejected: { label: "مرفوض ❌", color: "bg-red-500/10 text-red-600 border-red-500/30", icon: XCircle, iconColor: "text-red-500" },
};

const methodLabels: Record<string, string> = {
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
  bank_transfer: "تحويل بنكي",
  orange_cash: "أورنج كاش",
  etisalat_cash: "اتصالات كاش",
  online: "دفع أونلاين",
  home_delivery: "تحصيل منزلي",
};

export default function TrackDonation() {
  const [phone, setPhone] = useState("");
  const [refqa, setRefqa] = useState("");
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!phone.trim()) { setError("يرجى إدخال رقم الهاتف"); return; }
    setLoading(true); setError(""); setSearched(false);
    try {
      const params = new URLSearchParams({ phone: phone.trim() });
      if (refqa.trim()) params.set("refqa_id", refqa.trim());
      const data = await api.get<Donation[]>(`/donations/track?${params.toString()}`);
      setDonations(data || []);
      setSearched(true);
    } catch (e: any) {
      setError(e.message || "حدث خطأ أثناء البحث");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen font-body bg-background" dir="rtl">
      <TopBar />
      <Navbar />

      <div className="container max-w-2xl py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">تتبع تبرعك</h1>
          <p className="text-muted-foreground">أدخل رقم هاتفك للاطلاع على حالة تبرعاتك السابقة</p>
        </motion.div>

        {/* Search box */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="bg-card border border-border rounded-2xl p-6 shadow-card mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" /> رقم الهاتف *
              </label>
              <Input
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                dir="ltr" type="tel"
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" /> رقم التبرع (اختياري)
              </label>
              <Input
                value={refqa} onChange={e => setRefqa(e.target.value)}
                placeholder="Refqa-20260329-0001"
                dir="ltr"
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
              <p className="text-xs text-muted-foreground mt-1">ابحث بالهاتف فقط لعرض كل تبرعاتك، أو أضف رقم التبرع لتبرع محدد</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <Button onClick={handleSearch} disabled={loading} className="w-full h-12 text-base font-bold gradient-emerald text-primary-foreground">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin ml-2" /> جاري البحث...</> : <><Search className="w-5 h-5 ml-2" /> ابحث عن تبرعاتي</>}
            </Button>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {searched && (
            <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {donations.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لم يُعثر على تبرعات بهذه البيانات</p>
                  <p className="text-sm mt-1">تأكد من رقم الهاتف المستخدم عند التبرع</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground font-medium">تم العثور على {donations.length} تبرع</p>
                  {donations.map((d, idx) => {
                    const cfg = statusConfig[d.status] ?? statusConfig.pending;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.07 } }}
                        className="bg-card border border-border rounded-2xl p-5 shadow-card"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-bold text-base">{fmt(d.amount)}</p>
                            {d.campaign_title && <p className="text-sm text-muted-foreground">{d.campaign_title}</p>}
                          </div>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                            <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} /> {cfg.label}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-sm text-muted-foreground border-t border-border pt-3">
                          {(d.refqa_id || d.operation_id) && (
                            <div className="flex justify-between">
                              <span>رقم التبرع</span>
                              <span className="font-mono font-medium text-foreground text-xs">{d.refqa_id || d.operation_id}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>طريقة الدفع</span>
                            <span>{methodLabels[d.payment_method] || d.payment_method}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>تاريخ التبرع</span>
                            <span>{fmtDate(d.created_at)}</span>
                          </div>
                          {d.confirmed_at && (
                            <div className="flex justify-between">
                              <span>تاريخ الاعتماد</span>
                              <span className="text-green-600">{fmtDate(d.confirmed_at)}</span>
                            </div>
                          )}
                          {d.notes && (
                            <div className="flex justify-between">
                              <span>ملاحظات</span>
                              <span className="text-right max-w-[180px]">{d.notes}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
