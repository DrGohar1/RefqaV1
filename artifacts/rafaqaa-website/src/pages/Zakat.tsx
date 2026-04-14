import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, ArrowRight, Coins, CircleDollarSign, Package, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NISAB_GOLD_GRAM = 85; // grams of gold
const GOLD_PRICE_EGP = 4200; // approx price per gram 2026
const NISAB_EGP = NISAB_GOLD_GRAM * GOLD_PRICE_EGP;
const ZAKAT_RATE = 0.025;

type CalcType = "money" | "gold" | "trade";

const Zakat = () => {
  const [calcType, setCalcType] = useState<CalcType>("money");
  const [money, setMoney] = useState("");
  const [goldGrams, setGoldGrams] = useState("");
  const [goldKarat, setGoldKarat] = useState("24");
  const [tradeGoods, setTradeGoods] = useState("");
  const [tradeDebts, setTradeDebts] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    let total = 0;
    if (calcType === "money") {
      total = Number(money) || 0;
    } else if (calcType === "gold") {
      const grams = Number(goldGrams) || 0;
      const purity = Number(goldKarat) / 24;
      total = grams * purity * GOLD_PRICE_EGP;
    } else {
      total = (Number(tradeGoods) || 0) - (Number(tradeDebts) || 0);
    }

    if (total >= NISAB_EGP) {
      setResult(total * ZAKAT_RATE);
    } else {
      setResult(0);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(n);

  const types = [
    { id: "money" as CalcType, label: "زكاة المال", icon: CircleDollarSign, desc: "النقود والودائع" },
    { id: "gold" as CalcType, label: "زكاة الذهب", icon: Coins, desc: "الذهب والفضة" },
    { id: "trade" as CalcType, label: "عروض التجارة", icon: Package, desc: "البضائع والسلع" },
  ];

  return (
    <div className="min-h-screen font-body bg-background">
      <Navbar />
      <div className="container py-12 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowRight className="w-4 h-4" /> العودة للرئيسية
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-emerald flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">حاسبة الزكاة</h1>
            <p className="text-muted-foreground text-sm">احسب زكاة مالك وفق المعايير الشرعية — نصاب {new Date().getFullYear()}</p>
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => { setCalcType(t.id); setResult(null); }}
                className={`p-4 rounded-2xl border-2 transition-all text-center ${
                  calcType === t.id
                    ? "border-primary bg-accent shadow-card"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <t.icon className={`w-6 h-6 mx-auto mb-2 ${calcType === t.id ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm font-bold">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>

          {/* Calculator form */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
            <div className="bg-accent/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">نصاب الزكاة الحالي (85 جرام ذهب)</p>
              <p className="font-bold text-primary text-lg">{formatCurrency(NISAB_EGP)}</p>
            </div>

            {calcType === "money" && (
              <div className="space-y-3">
                <label className="text-sm font-bold block">إجمالي الأموال والودائع (جنيه مصري)</label>
                <Input
                  type="number"
                  value={money}
                  onChange={(e) => setMoney(e.target.value)}
                  placeholder="أدخل المبلغ الإجمالي"
                  className="text-lg"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">يشمل: النقود + الحسابات البنكية + الودائع التي مر عليها حول كامل</p>
              </div>
            )}

            {calcType === "gold" && (
              <div className="space-y-3">
                <label className="text-sm font-bold block">وزن الذهب (جرام)</label>
                <Input
                  type="number"
                  value={goldGrams}
                  onChange={(e) => setGoldGrams(e.target.value)}
                  placeholder="عدد الجرامات"
                  dir="ltr"
                />
                <label className="text-sm font-bold block">عيار الذهب</label>
                <select
                  value={goldKarat}
                  onChange={(e) => setGoldKarat(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="24">24 قيراط</option>
                  <option value="21">21 قيراط</option>
                  <option value="18">18 قيراط</option>
                </select>
                <p className="text-xs text-muted-foreground">سعر الجرام المعتمد: {formatCurrency(GOLD_PRICE_EGP)}</p>
              </div>
            )}

            {calcType === "trade" && (
              <div className="space-y-3">
                <label className="text-sm font-bold block">قيمة البضائع والسلع (جنيه)</label>
                <Input type="number" value={tradeGoods} onChange={(e) => setTradeGoods(e.target.value)} placeholder="إجمالي قيمة البضاعة" dir="ltr" />
                <label className="text-sm font-bold block">الديون المستحقة عليك</label>
                <Input type="number" value={tradeDebts} onChange={(e) => setTradeDebts(e.target.value)} placeholder="إجمالي الديون" dir="ltr" />
              </div>
            )}

            <Button onClick={calculate} className="w-full gap-2 py-6 text-lg gradient-emerald text-primary-foreground">
              <Calculator className="w-5 h-5" /> احسب الزكاة
            </Button>

            {result !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl p-6 text-center ${result > 0 ? "bg-primary/10 border border-primary/20" : "bg-muted"}`}
              >
                {result > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">مبلغ الزكاة المستحقة</p>
                    <p className="text-4xl font-bold text-primary font-display">{formatCurrency(result)}</p>
                    <p className="text-xs text-muted-foreground mt-2">2.5% من إجمالي المال الذي بلغ النصاب</p>
                    <a href="#campaigns" className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-emerald text-primary-foreground font-bold text-sm">
                      <Heart className="w-4 h-4" /> ادفع زكاتك الآن
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold">لم يبلغ النصاب</p>
                    <p className="text-sm text-muted-foreground">المبلغ أقل من نصاب الزكاة ({formatCurrency(NISAB_EGP)})</p>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Zakat;
