import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/data/campaigns";
import { useBasket } from "@/contexts/BasketContext";
import { useAuth } from "@/contexts/AuthContext";
import { insertDonation, uploadReceipt, generateOperationId, fetchPaymentMethods } from "@/lib/supabase-helpers";
import api from "@/lib/api-client";
import { useSocialLinks } from "@/contexts/SocialLinksContext";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import {
  Check, X, Copy, Upload, Smartphone, Building2, Zap, ArrowLeft, ArrowRight,
  CheckCircle2, MessageCircle, Wallet, CreditCard, ExternalLink, Phone,
  Home, Users2, Globe, Banknote, MapPin, Clock, Loader2, Shield, Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

// ─────────────────────────────── Types ───────────────────────────────
type PaymentType = "online" | "manual" | "home_delivery" | "show_agent";
type Step = "type" | "info" | "method" | "home_form" | "online_pay" | "upload" | "success";

interface PaymentMethod {
  id: string; label: string; icon: React.ReactNode;
  accountNumber: string; accountName: string; instructions: string;
  type?: string; ussd_code?: string; transfer_link?: string;
}

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: { id: string; title: string };
  prefillAmount?: number;
}

// ─────────────────────────────── Icons map ───────────────────────────
const iconMap: Record<string, React.ReactNode> = {
  vodafone_cash: <Smartphone className="w-6 h-6" />,
  orange_cash: <Wallet className="w-6 h-6" />,
  etisalat_cash: <CreditCard className="w-6 h-6" />,
  bank_transfer: <Building2 className="w-6 h-6" />,
  instapay: <Zap className="w-6 h-6" />,
  wallet: <Wallet className="w-6 h-6" />,
};

const fallbackMethods: PaymentMethod[] = [
  { id: "vodafone_cash", label: "فودافون كاش", icon: <Smartphone className="w-6 h-6" />, accountNumber: "01130925036", accountName: "مؤسسة رفقاء البررة", instructions: "حوّل المبلغ ثم ارفع الإيصال", type: "vodafone_cash" },
  { id: "instapay", label: "انستاباي", icon: <Zap className="w-6 h-6" />, accountNumber: "01130925036", accountName: "مؤسسة رفقاء البررة", instructions: "استخدم انستاباي ثم ارفع لقطة الشاشة", type: "instapay" },
  { id: "bank_transfer", label: "تحويل بنكي", icon: <Building2 className="w-6 h-6" />, accountNumber: "EG123456789012345678901234", accountName: "مؤسسة رفقاء البررة للتنمية", instructions: "حوّل للحساب البنكي ثم ارفع الإيصال", type: "bank_transfer" },
];

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000, 5000];

const PAYMENT_TYPES = [
  {
    id: "online" as PaymentType,
    icon: <Globe className="w-8 h-8" />,
    label: "دفع أونلاين",
    desc: "فيزا / ماستركارد / فوري / محافظ",
    color: "from-blue-500 to-blue-600",
    badge: "آمن وفوري",
  },
  {
    id: "manual" as PaymentType,
    icon: <Banknote className="w-8 h-8" />,
    label: "تحويل يدوي",
    desc: "فودافون كاش / انستاباي / بنكي",
    color: "from-primary to-primary/80",
    badge: "الأكثر استخداماً",
  },
  {
    id: "home_delivery" as PaymentType,
    icon: <Home className="w-8 h-8" />,
    label: "دفع منزلي",
    desc: "مندوبنا يجيلك في بيتك",
    color: "from-amber-500 to-amber-600",
    badge: "مريح",
  },
  {
    id: "show_agent" as PaymentType,
    icon: <Users2 className="w-8 h-8" />,
    label: "عن طريق مندوب",
    desc: "تبرع مع مندوبنا الميداني",
    color: "from-purple-500 to-purple-600",
    badge: "ميداني",
  },
];

// ─────────────────────────────── Component ───────────────────────────
export default function DonationModal({ open, onOpenChange, campaign, prefillAmount }: DonationModalProps) {
  const { items, clearBasket } = useBasket();
  const { user } = useAuth();
  const { toast } = useToast();
  const { links: socialLinks } = useSocialLinks();
  const { flags } = useFeatureFlags();

  const [step, setStep] = useState<Step>("type");
  const [paymentType, setPaymentType] = useState<PaymentType | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [operationId, setOperationId] = useState("");
  const [methods, setMethods] = useState<PaymentMethod[]>(fallbackMethods);
  const [paymobConfigured, setPaymobConfigured] = useState<boolean | null>(null);
  const [paymobLoading, setPaymobLoading] = useState(false);
  const [paymobUrl, setPaymobUrl] = useState("");
  // Home delivery fields
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [homeNotes, setHomeNotes] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBasketMode = !campaign && items.length > 0;
  const totalFromBasket = items.reduce((s, i) => s + i.amount, 0);
  const finalAmount = isBasketMode ? totalFromBasket : Number(amount);

  useEffect(() => {
    if (open) {
      fetchPaymentMethods().then(dbMethods => {
        if (dbMethods?.length > 0) {
          setMethods(dbMethods.map((m: any, i: number) => ({
            id: m.method?.toLowerCase().replace(/\s+/g, "_") || `method_${i}`,
            label: m.method || "طريقة دفع",
            icon: iconMap[m.type] || <Wallet className="w-6 h-6" />,
            accountNumber: m.account_number || "",
            accountName: m.account_name || "",
            instructions: "حوّل المبلغ ثم ارفع الإيصال",
            type: m.type,
            ussd_code: m.ussd_code || "",
            transfer_link: m.transfer_link || "",
          })));
        }
      }).catch(() => {});

      api.get<{ configured: boolean; test_mode?: boolean }>("/payment-settings/status")
        .then(d => setPaymobConfigured(d.configured || d.test_mode === true))
        .catch(() => setPaymobConfigured(true)); // default: demo mode available

      if (prefillAmount) setAmount(String(prefillAmount));
    }
  }, [open, prefillAmount]);

  const reset = () => {
    setStep("type"); setPaymentType(null); setAmount(""); setSelectedMethod(null);
    setDonorName(""); setDonorPhone(""); setDonorEmail("");
    setReceiptFile(null); setReceiptPreview(null); setOperationId("");
    setAddress(""); setZone(""); setPreferredTime(""); setHomeNotes("");
    setPaymobUrl("");
  };

  const handleClose = (val: boolean) => { if (!val) reset(); onOpenChange(val); };

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setReceiptFile(file); const r = new FileReader(); r.onloadend = () => setReceiptPreview(r.result as string); r.readAsDataURL(file); }
  };

  const triggerConfetti = () => confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#10B981", "#D4AF37", "#ffffff"] });

  const getTransferLink = (m: PaymentMethod) => {
    if (m.transfer_link) return m.transfer_link.replace("{amount}", String(finalAmount)).replace("{account}", m.accountNumber);
    if (m.type === "instapay") return `https://ipn.eg/S/${m.accountNumber}/instapay/EGP${finalAmount ? `/${finalAmount}` : ""}`;
    return null;
  };

  const getUssdCode = (m: PaymentMethod) => {
    if (m.ussd_code) return m.ussd_code.replace("{amount}", String(finalAmount)).replace("{account}", m.accountNumber);
    if (m.type === "vodafone_cash") return `tel:*9*${m.accountNumber}*${finalAmount}%23`;
    return null;
  };

  // Submit manual donation
  const handleManualSubmit = async () => {
    if (!selectedMethod || !donorName.trim() || !donorPhone.trim()) {
      toast({ title: "خطأ", description: "يرجى ملء جميع البيانات المطلوبة", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      let receiptUrl: string | undefined;
      if (receiptFile) receiptUrl = (await uploadReceipt(receiptFile)) || undefined;
      const opId = generateOperationId();
      setOperationId(opId);
      if (isBasketMode) {
        for (const item of items) {
          await insertDonation({ donor_name: donorName.trim(), donor_phone: donorPhone.trim(), campaign_id: item.campaign.id, campaign_title: item.campaign.title, amount: item.amount, payment_method: selectedMethod.id, operation_id: generateOperationId(), receipt_image_url: receiptUrl, user_id: user?.id });
        }
        clearBasket();
      } else if (campaign) {
        await insertDonation({ donor_name: donorName.trim(), donor_phone: donorPhone.trim(), campaign_id: campaign.id, campaign_title: campaign.title, amount: Number(amount), payment_method: selectedMethod.id, operation_id: opId, receipt_image_url: receiptUrl, user_id: user?.id });
      }
      setStep("success"); triggerConfetti();
    } catch (err: any) { toast({ title: "خطأ", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  // Initiate online payment
  const handleOnlinePay = async () => {
    setPaymobLoading(true);
    try {
      const res = await api.post<any>("/payments/initiate", {
        amount: finalAmount, donor_name: donorName, donor_phone: donorPhone, donor_email: donorEmail,
        campaign_id: campaign?.id, campaign_title: campaign?.title, integration_type: "card",
      });
      if (res.not_configured) {
        toast({ title: "بوابة الدفع", description: res.message, variant: "destructive" }); return;
      }
      const refqaId = res.refqa_id;
      setOperationId(refqaId);

      // Embed payment page in modal as iframe
      if (res.payment_url) {
        setPaymobUrl(res.payment_url);
      } else if (res.demo_mode) {
        // Demo mode: show success after short delay
        setPaymobUrl("demo");
      }
      setStep("online_pay");
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setPaymobLoading(false); }
  };

  // Submit home delivery request
  const handleHomeDelivery = async () => {
    if (!donorName.trim() || !donorPhone.trim() || !address.trim()) {
      toast({ title: "خطأ", description: "الاسم والهاتف والعنوان مطلوبة", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      await api.post("/field-orders", {
        order_type: "home_delivery", donor_name: donorName.trim(), donor_phone: donorPhone.trim(),
        address, zone, preferred_time: preferredTime, amount: finalAmount,
        campaign_id: campaign?.id, campaign_title: campaign?.title, notes: homeNotes,
      });
      setOperationId(`HOME-${Date.now()}`);
      setStep("success"); triggerConfetti();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const waNumber = socialLinks.whatsapp || "201130925036";
  const whatsappMessage = `السلام عليكم، أنا ${donorName}، قمت بتبرع بمبلغ ${formatCurrency(finalAmount)} لصالح ${campaign?.title || "رفقاء البررة"} - رقم العملية: ${operationId}`;
  const whatsappUrl = `https://wa.me/${waNumber.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;

  const stepCount = paymentType === "manual" ? 3 : paymentType === "home_delivery" ? 2 : 1;
  const currentStepNum = step === "info" ? 1 : step === "method" ? 2 : step === "upload" ? 3 : step === "home_form" ? 2 : step === "online_pay" ? 2 : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`${step === "online_pay" && operationId && paymobUrl && paymobUrl !== "demo" ? "max-w-2xl" : "max-w-lg"} max-h-[92vh] overflow-y-auto p-0 gap-0 transition-all`}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-center">
              {step === "success" ? "جزاك الله خيراً 🎉" : isBasketMode ? "إتمام سلة التبرعات" : campaign ? `التبرع لـ ${campaign.title}` : "تبرع الآن"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              {step === "type" && "اختر طريقة الدفع المناسبة لك"}
              {step === "info" && "أدخل بياناتك والمبلغ"}
              {step === "method" && "اختر وسيلة التحويل"}
              {step === "upload" && "ارفع إيصال الدفع"}
              {step === "home_form" && "أدخل عنوانك وموعد التحصيل"}
              {step === "online_pay" && "ادفع بأمان عبر بوابة Paymob"}
              {step === "success" && (paymentType === "home_delivery" ? "سيتواصل معك مندوبنا قريباً" : "سيتم مراجعة تبرعك قريباً")}
            </DialogDescription>
          </DialogHeader>
          {/* Progress */}
          {step !== "type" && step !== "success" && currentStepNum > 0 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {Array.from({ length: stepCount }).map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i < currentStepNum ? "bg-primary w-8" : "bg-muted w-4"}`} />
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-5">
          <AnimatePresence mode="wait">

            {/* ─── STEP: TYPE SELECT ─── */}
            {step === "type" && (
              <motion.div key="type" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-3">
                {flags.site_disabled && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                    <p className="text-red-700 font-bold text-sm">🔴 {String(flags.site_disabled_message || "الموقع في وضع الصيانة")}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_TYPES.filter(pt => {
                    if (flags.site_disabled) return false;
                    if (pt.id === "online" && !flags.api_payments) return false;
                    if (pt.id === "manual" && !flags.manual_payments) return false;
                    if (pt.id === "home_delivery" && !flags.home_delivery) return false;
                    if (pt.id === "show_agent" && !flags.agent_donations) return false;
                    return true;
                  }).map(pt => (
                    <motion.button
                      key={pt.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { setPaymentType(pt.id); setStep("info"); }}
                      className="relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all text-center group overflow-hidden"
                    >
                      {/* Badge */}
                      <span className="absolute top-2 right-2 text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{pt.badge}</span>
                      {/* Icon with gradient bg */}
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pt.color} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                        {pt.icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{pt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{pt.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── STEP: INFO ─── */}
            {step === "info" && (
              <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {/* Selected type badge */}
                {paymentType && (
                  <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${PAYMENT_TYPES.find(p => p.id === paymentType)?.color} text-white flex items-center justify-center`}>
                      {PAYMENT_TYPES.find(p => p.id === paymentType)?.icon && (
                        <span className="scale-75">{PAYMENT_TYPES.find(p => p.id === paymentType)?.icon}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-primary">{PAYMENT_TYPES.find(p => p.id === paymentType)?.label}</span>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block">الاسم الكامل *</label>
                  <Input value={donorName} onChange={e => setDonorName(e.target.value)} placeholder="أدخل اسمك الكامل" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">رقم الهاتف *</label>
                  <Input value={donorPhone} onChange={e => setDonorPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
                </div>
                {paymentType === "online" && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">البريد الإلكتروني (اختياري)</label>
                    <Input value={donorEmail} onChange={e => setDonorEmail(e.target.value)} placeholder="example@email.com" dir="ltr" type="email" />
                  </div>
                )}

                {!isBasketMode && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-1 block">المبلغ (جنيه مصري) *</label>
                      <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="أدخل المبلغ" className="text-lg font-bold" dir="ltr" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_AMOUNTS.map(a => (
                        <button key={a} onClick={() => setAmount(String(a))} className={`py-2 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${amount === String(a) ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "border-border hover:border-primary/40 hover:text-primary"}`}>
                          {formatCurrency(a)}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {isBasketMode && (
                  <div className="bg-muted rounded-xl p-4 space-y-2">
                    {items.map(item => (
                      <div key={item.campaign.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.campaign.title}</span>
                        <span className="font-bold">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 flex justify-between font-bold">
                      <span>الإجمالي</span>
                      <span className="text-primary">{formatCurrency(totalFromBasket)}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("type")} className="gap-1.5"><ArrowRight className="w-4 h-4" />رجوع</Button>
                  <Button
                    onClick={() => {
                      if (!donorName.trim() || !donorPhone.trim() || (!isBasketMode && !amount)) {
                        toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" }); return;
                      }
                      if (paymentType === "manual") setStep("method");
                      else if (paymentType === "online") setStep("online_pay");
                      else if (paymentType === "home_delivery") setStep("home_form");
                      else if (paymentType === "show_agent") {
                        setSubmitting(true);
                        api.post("/field-orders", {
                          order_type: "show_agent",
                          donor_name: donorName.trim(),
                          donor_phone: donorPhone.trim(),
                          amount: finalAmount,
                          campaign_id: campaign?.id,
                          campaign_title: campaign?.title,
                        }).then((_res: any) => {
                          const id = generateOperationId();
                          setOperationId(id);
                        }).catch(() => {}).finally(() => setSubmitting(false));
                        setStep("success");
                        triggerConfetti();
                      }
                    }}
                    className="flex-1 gap-1.5"
                  >
                    {paymentType === "show_agent" ? "تسجيل الطلب" : "التالي"} <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP: ONLINE PAY ─── */}
            {step === "online_pay" && (
              <motion.div key="online_pay" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">

                {/* ── Pre-payment summary (before initiating) ── */}
                {!operationId && !paymobLoading && (
                  <>
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-200 dark:border-blue-900 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                          <Shield className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold">دفع إلكتروني آمن</p>
                          <p className="text-xs text-muted-foreground">مشفر بتقنية SSL 256-bit</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                        {["فيزا / ماستركارد", "فوري", "محافظ إلكترونية"].map(m => (
                          <div key={m} className="bg-white/50 dark:bg-white/5 rounded-xl py-2 px-1 font-medium">{m}</div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-muted rounded-xl p-4 text-sm space-y-1.5">
                      <div className="flex justify-between"><span className="text-muted-foreground">المتبرع:</span><span className="font-bold">{donorName}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">المبلغ:</span><span className="font-bold text-primary text-base">{formatCurrency(finalAmount)}</span></div>
                      {campaign && <div className="flex justify-between"><span className="text-muted-foreground">الحملة:</span><span className="font-bold">{campaign.title}</span></div>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep("info")} className="gap-1.5"><ArrowRight className="w-4 h-4" />رجوع</Button>
                      <Button
                        onClick={handleOnlinePay}
                        disabled={paymobLoading}
                        className="flex-1 gap-2 h-12 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        <Globe className="w-5 h-5" />ادفع الآن بأمان
                      </Button>
                    </div>
                  </>
                )}

                {/* ── Loading spinner ── */}
                {paymobLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-sm text-muted-foreground">جاري تحضير صفحة الدفع...</p>
                  </div>
                )}

                {/* ── Paymob iframe — embeds payment page inside modal ── */}
                {operationId && paymobUrl && paymobUrl !== "demo" && (
                  <div className="space-y-3">
                    <div className="bg-blue-500/10 border border-blue-200 dark:border-blue-900 rounded-xl p-3 flex items-center gap-3">
                      <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300">دفع آمن داخل الموقع</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate" dir="ltr">رقم العملية: {operationId}</p>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(operationId); toast({ title: "✅ تم نسخ رقم العملية" }); }}
                        className="flex-shrink-0 p-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 transition-colors"
                        title="نسخ رقم العملية"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-white">
                      <iframe
                        src={paymobUrl}
                        className="w-full"
                        style={{ height: "520px", border: "none" }}
                        title="بوابة الدفع الآمنة — Paymob"
                        sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation allow-popups"
                        allow="payment"
                      />
                    </div>
                    <Button onClick={() => { setStep("success"); triggerConfetti(); }} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <CheckCircle2 className="w-4 h-4" /> أتممت الدفع بنجاح
                    </Button>
                  </div>
                )}

                {/* ── Demo mode ── */}
                {operationId && paymobUrl === "demo" && (
                  <div className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-200 dark:border-amber-900 rounded-2xl p-5 text-center space-y-3">
                      <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                        <Globe className="w-7 h-7 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-bold text-amber-800 dark:text-amber-300">وضع تجريبي</p>
                        <p className="text-xs text-muted-foreground mt-1">بوابة الدفع لم تُضبط بعد — تواصل مع المدير</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-muted-foreground mb-1">رقم عمليتك</p>
                        <p className="font-mono font-bold text-amber-700 dark:text-amber-400">{operationId}</p>
                      </div>
                    </div>
                    <Button onClick={() => { setStep("success"); triggerConfetti(); }} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <CheckCircle2 className="w-4 h-4" /> تأكيد وإغلاق
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── STEP: METHOD (manual) ─── */}
            {step === "method" && (
              <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {methods.map(method => (
                    <motion.button key={method.id} whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMethod(method)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all min-h-[100px] ${selectedMethod?.id === method.id ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20" : "border-border bg-card hover:border-primary/40"}`}
                    >
                      {selectedMethod?.id === method.id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${selectedMethod?.id === method.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {method.icon}
                      </div>
                      <span className="font-bold text-xs text-center leading-tight">{method.label}</span>
                    </motion.button>
                  ))}
                </div>

                {selectedMethod && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl border-2 border-primary/20 overflow-hidden">
                    <div className="bg-primary/10 px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center">{selectedMethod.icon}</div>
                      <h4 className="font-bold">{selectedMethod.label}</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="bg-muted rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">{selectedMethod.type === "bank_transfer" ? "رقم الحساب" : selectedMethod.type === "instapay" ? "رقم انستاباي" : `رقم ${selectedMethod.label}`}</p>
                        <div className="flex items-center justify-between">
                          <p className="font-mono font-bold text-lg tracking-widest" dir="ltr">{selectedMethod.accountNumber}</p>
                          <button onClick={() => handleCopy(selectedMethod.accountNumber)}
                            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center gap-1 hover:bg-primary/20 transition-colors">
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "تم" : "نسخ"}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">باسم: <span className="font-bold text-foreground">{selectedMethod.accountName}</span></p>
                      <p className="font-bold text-primary">المبلغ: {formatCurrency(finalAmount)}</p>
                      <div className="space-y-2 pt-1">
                        {getTransferLink(selectedMethod) && (
                          <a href={getTransferLink(selectedMethod)!} target="_blank" rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20">
                            <ExternalLink className="w-4 h-4" />تحويل مباشر عبر {selectedMethod.label}
                          </a>
                        )}
                        {getUssdCode(selectedMethod) && (
                          <a href={getUssdCode(selectedMethod)!}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm border border-border hover:bg-accent/80 transition-all active:scale-[0.98]">
                            <Phone className="w-4 h-4" />اتصال سريع بكود USSD
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground text-center">⚡ بعد التحويل، ارفع صورة الإيصال في الخطوة التالية</p>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("info")} className="gap-1.5"><ArrowRight className="w-4 h-4" />رجوع</Button>
                  <Button onClick={() => setStep("upload")} disabled={!selectedMethod} className="flex-1 gap-1.5">التالي<ArrowLeft className="w-4 h-4" /></Button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP: HOME FORM ─── */}
            {step === "home_form" && (
              <motion.div key="home_form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex gap-3 items-start">
                  <Home className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">سيتواصل معك مندوبنا الميداني خلال 24 ساعة لتحديد موعد الزيارة.</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">العنوان بالتفصيل *</label>
                  <Input placeholder="مثال: 25 شارع النيل، عمارة 3، شقة 5" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">المنطقة / الحي</label>
                    <Input placeholder="مثال: مدينة نصر" value={zone} onChange={e => setZone(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">الوقت المفضل</label>
                    <select value={preferredTime} onChange={e => setPreferredTime(e.target.value)}
                      className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background h-10">
                      <option value="">أي وقت</option>
                      <option value="صباحاً (9-12)">صباحاً (9-12)</option>
                      <option value="ظهراً (12-3)">ظهراً (12-3)</option>
                      <option value="عصراً (3-6)">عصراً (3-6)</option>
                      <option value="مساءً (6-9)">مساءً (6-9)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">ملاحظات (اختياري)</label>
                  <Input placeholder="أي تعليمات للمندوب" value={homeNotes} onChange={e => setHomeNotes(e.target.value)} />
                </div>

                <div className="bg-muted rounded-xl p-3 text-sm">
                  <div className="flex justify-between mb-1"><span className="text-muted-foreground">المتبرع:</span><span className="font-bold">{donorName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">المبلغ:</span><span className="font-bold text-primary">{formatCurrency(finalAmount)}</span></div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("info")} className="gap-1.5"><ArrowRight className="w-4 h-4" />رجوع</Button>
                  <Button onClick={handleHomeDelivery} disabled={submitting} className="flex-1 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />جاري...</>  : <><Home className="w-4 h-4" />تأكيد طلب التحصيل</>}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP: UPLOAD ─── */}
            {step === "upload" && (
              <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/2 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {receiptPreview ? (
                    <div className="space-y-3">
                      <img src={receiptPreview} alt="إيصال" className="max-h-44 mx-auto rounded-xl shadow-md" />
                      <p className="text-sm text-primary font-bold flex items-center gap-1 justify-center"><Check className="w-4 h-4" />تم رفع الإيصال</p>
                      <button onClick={e => { e.stopPropagation(); setReceiptFile(null); setReceiptPreview(null); }} className="text-xs text-destructive hover:underline">إزالة</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                        <Upload className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="font-bold text-sm">اضغط لرفع صورة الإيصال</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG حتى 5MB</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>

                <div className="bg-muted rounded-xl p-4 text-sm space-y-1.5">
                  {[["الاسم", donorName], ["الهاتف", donorPhone], ["الطريقة", selectedMethod?.label], ["المبلغ", formatCurrency(finalAmount)]].map(([l, v]) => (
                    <div key={String(l)} className="flex justify-between">
                      <span className="text-muted-foreground">{l}:</span><span className="font-bold">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("method")} className="gap-1.5"><ArrowRight className="w-4 h-4" />رجوع</Button>
                  <Button onClick={handleManualSubmit} disabled={submitting} className="flex-1 gap-1.5">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الإرسال...</> : "تأكيد التبرع ✓"}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP: SUCCESS ─── */}
            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 py-2">
                {/* Animated check */}
                <div className="relative mx-auto w-28 h-28">
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-primary flex items-center justify-center shadow-xl shadow-primary/30"
                  >
                    <CheckCircle2 className="w-14 h-14 text-white" />
                  </motion.div>
                  {/* Stars */}
                  {[0, 1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="absolute text-yellow-400"
                      style={{ top: `${["-10%", "80%", "-5%", "75%"][i]}`, left: `${["75%", "75%", "10%", "5%"][i]}` }}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </motion.div>
                  ))}
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}>
                  <h3 className="font-display text-2xl font-bold text-primary">جزاك الله خيراً 🎉</h3>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                    {paymentType === "home_delivery"
                      ? "تم استلام طلب التحصيل المنزلي — سيتواصل معك مندوبنا قريباً"
                      : paymentType === "show_agent"
                      ? "تم تسجيل طلبك — سيتواصل معك مندوبنا الميداني"
                      : "تم استلام تبرعك وسيتم مراجعته من قبل الإدارة"}
                  </p>
                </motion.div>

                {/* Refqa ID — prominent */}
                {operationId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 0.4 } }}
                    className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-2xl p-4"
                  >
                    <p className="text-xs text-muted-foreground mb-2 font-medium">رقم تبرعك — احتفظ به للمتابعة</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono font-bold text-primary text-base tracking-wide" dir="ltr">{operationId}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(operationId); toast({ title: "✅ تم نسخ رقم التبرع" }); }}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" /> نسخ
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">يمكنك استخدام هذا الرقم في صفحة <a href="/track" className="text-primary underline">تتبع التبرع</a></p>
                  </motion.div>
                )}

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.5 } }} className="space-y-2">
                  <a href={whatsappUrl} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors shadow-lg active:scale-[0.98]">
                    <MessageCircle className="w-5 h-5" /> أبلغ المؤسسة عبر واتساب
                  </a>
                  <Button variant="outline" onClick={() => handleClose(false)} className="w-full">إغلاق</Button>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
