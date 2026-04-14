import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api-client";
import { ChevronRight, ChevronLeft, Smartphone, Zap, Building2, Phone, Copy, Check } from "lucide-react";

const PAYMENT_ITEMS = [
  { icon: <Smartphone className="w-5 h-5" />, label: "فودافون كاش", number: "01130925036", color: "bg-red-500" },
  { icon: <Zap className="w-5 h-5" />, label: "إنستاباي", number: "01130925036", color: "bg-purple-500" },
  { icon: <Building2 className="w-5 h-5" />, label: "تحويل بنكي", number: "EG123456789012345678901234", color: "bg-blue-600" },
  { icon: <Phone className="w-5 h-5" />, label: "تحصيل منزلي", number: "اتصل بنا", color: "bg-amber-500" },
];

function StaticPaymentBanner() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="w-full px-4 py-6 max-w-7xl mx-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#1a3050] shadow-elevated"
      >
        <div className="p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-4"
          >
            <span className="inline-block bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold px-3 py-1 rounded-full border border-[#D4AF37]/30">
              🤝 طرق التبرع
            </span>
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="font-display text-2xl md:text-3xl font-bold text-white leading-tight mb-2"
          >
            تبرعك يصنع فارقاً
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/70 text-sm md:text-base mb-6"
          >
            تبرع بسهولة عبر إحدى الطرق التالية — كل تبرع يُحدث تغييراً حقيقياً
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PAYMENT_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/15 transition-colors group"
              >
                <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center text-white mb-2`}>
                  {item.icon}
                </div>
                <p className="text-white text-xs font-bold mb-1">{item.label}</p>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-white/60 text-[10px] font-mono truncate" dir="ltr">{item.number}</p>
                  {item.number !== "اتصل بنا" && (
                    <button
                      onClick={() => handleCopy(item.number, item.label)}
                      className="flex-shrink-0 p-1 rounded bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                      title="نسخ الرقم"
                    >
                      {copied === item.label
                        ? <Check className="w-3 h-3 text-green-400" />
                        : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 10% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />
      </motion.div>
    </section>
  );
}

const BG_MAP: Record<string, string> = {
  primary: "from-primary to-primary/80",
  navy: "from-[#0a1628] to-[#1a3050]",
  gold: "from-amber-500 to-amber-600",
  teal: "from-teal-600 to-teal-700",
  red: "from-red-500 to-red-600",
  purple: "from-purple-600 to-purple-700",
};

interface Banner {
  id: string; title: string; subtitle?: string; badge_text?: string;
  image_url?: string; link_url?: string; link_text?: string;
  bg_color: string; display_order: number; is_active: boolean;
}

export default function HomeBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    api.get<Banner[]>("/banners").then(data => {
      setBanners((data || []).filter(b => b.is_active));
    }).catch(() => {});
  }, []);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = () => setCurrent(c => (c - 1 + banners.length) % banners.length);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [banners.length, isPaused, next]);

  if (!banners.length) return <StaticPaymentBanner />;

  const b = banners[current];
  const gradient = BG_MAP[b.bg_color] || BG_MAP.primary;

  return (
    <section className="w-full px-4 py-6 max-w-7xl mx-auto" dir="rtl">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} shadow-elevated`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 min-h-[180px] md:min-h-[200px]"
          >
            {/* Text */}
            <div className="flex-1 text-white text-center md:text-right">
              {b.badge_text && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3 border border-white/30"
                >
                  {b.badge_text}
                </motion.span>
              )}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-display text-2xl md:text-3xl font-bold leading-tight mb-2"
              >
                {b.title}
              </motion.h3>
              {b.subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/85 text-sm md:text-base leading-relaxed"
                >
                  {b.subtitle}
                </motion.p>
              )}
              {b.link_url && b.link_text && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4"
                >
                  <a
                    href={b.link_url}
                    className="inline-flex items-center gap-2 bg-white text-primary font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-all shadow-lg hover:scale-105 active:scale-95"
                  >
                    {b.link_text}
                  </a>
                </motion.div>
              )}
            </div>
            {/* Image */}
            {b.image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="w-full md:w-48 lg:w-56 h-40 md:h-44 flex-shrink-0"
              >
                <img
                  src={b.image_url}
                  alt={b.title}
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute top-1/2 -translate-y-1/2 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute top-1/2 -translate-y-1/2 left-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all rounded-full ${i === current ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60"}`}
              />
            ))}
          </div>
        )}

        {/* Decorative pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 1px, transparent 1px), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>
    </section>
  );
}
