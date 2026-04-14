import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, ArrowDown, Sparkles, Calculator } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { fetchStats } from "@/lib/supabase-helpers";
import { Link } from "react-router-dom";

const formatNum = (n: number) => new Intl.NumberFormat("ar-EG").format(n);
const formatCurrency = (n: number) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(n);

const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.9]);

  const [stats, setStats] = useState({ donors: 0, totalRaised: 0, campaigns: 0, beneficiaries: 0 });

  useEffect(() => {
    fetchStats().then((data) => {
      if (data) setStats(data);
    }).catch(() => {});
  }, []);

  const quickLinks = [
    { label: "زكاة المال", icon: "💰", href: "/zakat" },
    { label: "كفالة يتيم", icon: "🤲", href: "#campaigns" },
    { label: "صدقة جارية", icon: "🕌", href: "#campaigns" },
    { label: "إطعام مسكين", icon: "🍞", href: "#campaigns" },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden gradient-hero min-h-[90vh] flex items-center">
      <div className="absolute inset-0 pattern-islamic-gold" />
      <motion.div style={{ y }} className="absolute top-10 left-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <motion.div style={{ y }} className="absolute bottom-10 right-20 w-72 h-72 rounded-full bg-gold/10 blur-3xl" />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/30"
          style={{ top: `${8 + i * 7}%`, left: `${3 + i * 8}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.15, 0.6, 0.15] }}
          transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
        />
      ))}

      <motion.div style={{ opacity, scale }} className="container relative z-10 py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary-foreground/90 text-sm font-medium">مؤسسة مرخصة — إشهار رقم 7932</span>
          </motion.div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-4">
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="block">
              تبرع وتصدق
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="block text-primary">
              وأسعد قلباً
            </motion.span>
          </h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="font-display text-xl md:text-2xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            صدقتك جارية وأجرك عظيم — نعمل بإخلاص لإيصال تبرعاتكم لمستحقيها
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <motion.a
              href="#campaigns"
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(16,185,129,0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl gradient-emerald text-primary-foreground font-bold text-lg shadow-elevated"
            >
              <Heart className="w-6 h-6" /> تبرع الآن
            </motion.a>
            <Link to="/zakat">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl border-2 border-primary-foreground/20 text-primary-foreground font-bold text-lg hover:bg-primary-foreground/5 backdrop-blur-sm transition-colors"
              >
                <Calculator className="w-6 h-6" /> حاسبة الزكاة
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Quick donate banners */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-12">
          {quickLinks.map((item, i) => (
            <motion.a
              key={i}
              href={item.href}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="p-4 rounded-2xl glass border border-primary-foreground/10 hover:border-primary/40 transition-colors cursor-pointer group"
            >
              <span className="text-2xl block mb-1">{item.icon}</span>
              <span className="text-primary-foreground/90 text-sm font-bold group-hover:text-primary transition-colors">{item.label}</span>
            </motion.a>
          ))}
        </motion.div>

        {/* Live Stats */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { value: stats.donors > 0 ? `${formatNum(stats.donors)}+` : "—", label: "متبرع" },
            { value: stats.totalRaised > 0 ? formatCurrency(stats.totalRaised) : "—", label: "تبرعات معتمدة" },
            { value: stats.campaigns > 0 ? `${formatNum(stats.campaigns)}+` : "—", label: "حملة" },
            { value: stats.beneficiaries > 0 ? `${formatNum(stats.beneficiaries)}+` : "—", label: "مستفيد" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4 + i * 0.1, type: "spring" }} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-primary-foreground/50 text-sm mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mt-10">
          <ArrowDown className="w-6 h-6 text-primary-foreground/30 mx-auto" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
