import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api-client";
import { Heart } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount);

interface TickerItem {
  id: string;
  donor_name: string;
  amount: number;
  campaign_title: string;
  created_at: string;
}

const DonationTicker = () => {
  const [donations, setDonations] = useState<TickerItem[]>([]);

  useEffect(() => {
    api.get<TickerItem[]>("/donations?status=approved&_order=created_at:desc&_limit=5")
      .then((data) => setDonations(data || []))
      .catch(() => {});
  }, []);

  if (donations.length === 0) return null;

  return (
    <section className="py-6 bg-primary/5 border-y border-border overflow-hidden">
      <div className="container">
        <div className="flex items-center gap-3 mb-4">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Heart className="w-5 h-5 text-primary" />
          </motion.div>
          <h3 className="font-display text-lg font-bold">آخر التبرعات المعتمدة</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {donations.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="shrink-0 bg-card rounded-xl p-4 shadow-card border border-border min-w-[220px]"
            >
              <p className="font-bold text-sm">{d.donor_name}</p>
              <p className="text-xs text-muted-foreground">{d.campaign_title}</p>
              <p className="text-lg font-bold text-primary mt-1">{formatCurrency(d.amount)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(d.created_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DonationTicker;
