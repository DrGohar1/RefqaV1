import { useState, useEffect } from "react";
import { fetchSettings, updateSettings } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, CreditCard, Wallet, Building2, Zap, Smartphone, Link2, Phone } from "lucide-react";

const typeOptions = [
  { value: "wallet", label: "محفظة إلكترونية", icon: <Wallet className="w-4 h-4" /> },
  { value: "instapay", label: "انستاباي", icon: <Zap className="w-4 h-4" /> },
  { value: "bank_transfer", label: "تحويل بنكي", icon: <Building2 className="w-4 h-4" /> },
  { value: "vodafone_cash", label: "فودافون كاش", icon: <Smartphone className="w-4 h-4" /> },
];

const AdminPayments = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchSettings("payment_methods")
      .then((data) => { if (data && Array.isArray(data)) setPayments(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addPayment = () => setPayments([...payments, { method: "", account_number: "", account_name: "", type: "wallet", ussd_code: "", transfer_link: "" }]);
  const removePayment = (i: number) => setPayments(payments.filter((_, idx) => idx !== i));
  const updatePayment = (i: number, field: string, value: string) =>
    setPayments(payments.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings("payment_methods", payments);
      toast({ title: "✅ تم حفظ بوابات الدفع بنجاح" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">{[1, 2].map((i) => <div key={i} className="h-32 bg-card rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" /> المصفوفة المالية
        </h2>
        <Button size="sm" variant="outline" onClick={addPayment} className="gap-1">
          <Plus className="w-4 h-4" /> إضافة طريقة
        </Button>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg font-bold">طرق الدفع اليدوية</h3>
        </div>
        <p className="text-sm text-muted-foreground">هذه الطرق تظهر للمتبرعين عند اختيار طريقة الدفع — أي تعديل يظهر فوراً</p>

        <div className="space-y-3">
          {payments.map((p, i) => (
            <div key={i} className="bg-muted rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 ml-2">
                  <select
                    value={p.type || "wallet"}
                    onChange={(e) => updatePayment(i, "type", e.target.value)}
                    className="px-3 py-2 rounded-lg bg-card border border-border text-sm"
                  >
                    {typeOptions.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <Input value={p.method} onChange={(e) => updatePayment(i, "method", e.target.value)} placeholder="اسم الطريقة (مثل: فودافون كاش)" className="flex-1" />
                </div>
                <button onClick={() => removePayment(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={p.account_number} onChange={(e) => updatePayment(i, "account_number", e.target.value)} placeholder="رقم الحساب / المحفظة" dir="ltr" />
                <Input value={p.account_name} onChange={(e) => updatePayment(i, "account_name", e.target.value)} placeholder="اسم صاحب الحساب" />
              </div>
              {/* New: Transfer link & USSD code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1"><Link2 className="w-3 h-3" /> رابط التحويل المباشر</label>
                  <Input
                    value={p.transfer_link || ""}
                    onChange={(e) => updatePayment(i, "transfer_link", e.target.value)}
                    placeholder="https://ipn.eg/S/0111.../instapay"
                    dir="ltr"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> كود USSD للاتصال</label>
                  <Input
                    value={p.ussd_code || ""}
                    onChange={(e) => updatePayment(i, "ussd_code", e.target.value)}
                    placeholder="tel:*9*{account}*{amount}#"
                    dir="ltr"
                    className="text-xs"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">استخدم <code className="bg-card px-1 rounded">{"{amount}"}</code> و <code className="bg-card px-1 rounded">{"{account}"}</code> و <code className="bg-card px-1 rounded">{"{name}"}</code> كمتغيرات ديناميكية</p>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">لم يتم إضافة أي طرق دفع بعد — اضغط "إضافة طريقة" للبدء</div>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ طرق الدفع"}
        </Button>
      </div>

      {/* Future: Online Payment Gateway */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-bold">بوابة الدفع الإلكتروني</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Paymob / Fawry — أدخل مفاتيح API لتفعيل الدفع الأونلاين</p>
        <div className="space-y-2">
          <Input placeholder="Paymob API Key" dir="ltr" />
          <Input placeholder="Fawry Merchant Code" dir="ltr" />
          <p className="text-xs text-muted-foreground">⚠️ سيتم تفعيل هذا القسم عند إضافة المفاتيح وربط Edge Function</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
