import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import { useBasket } from "@/contexts/BasketContext";
import { useToast } from "@/hooks/use-toast";
import DonationModal from "./DonationModal";

interface CampaignCardProps {
  campaign: any;
  index: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount);

const CampaignCard = ({ campaign, index }: CampaignCardProps) => {
  const progress = Math.round((Number(campaign.raised_amount || campaign.raisedAmount || 0) / Number(campaign.goal_amount || campaign.goalAmount || 1)) * 100);
  const { addItem } = useBasket();
  const { toast } = useToast();
  const [showDonation, setShowDonation] = useState(false);

  const title = campaign.title;
  const description = campaign.description;
  const category = campaign.category;
  const daysLeft = campaign.days_left ?? campaign.daysLeft ?? 0;
  const raisedAmount = Number(campaign.raised_amount ?? campaign.raisedAmount ?? 0);
  const goalAmount = Number(campaign.goal_amount ?? campaign.goalAmount ?? 1);
  const donorsCount = campaign.donors_count ?? campaign.donorsCount ?? 0;
  const image = campaign.image_url ?? campaign.image ?? "";

  const handleAddToBasket = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ id: campaign.id, title, description: description || "", category: category || "", goalAmount, raisedAmount, daysLeft, donorsCount, image, icon: "" }, 100);
    toast({ title: "تمت الإضافة", description: `تم إضافة "${title}" للسلة بمبلغ 100 جنيه` });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300"
      >
        <div className="relative h-48 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {category && <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-bold backdrop-blur-sm">{category}</div>}
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-card/90 text-foreground text-xs font-bold backdrop-blur-sm">{daysLeft} يوم</div>
        </div>

        <div className="p-5">
          <h3 className="font-display text-xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">{description}</p>

          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">{formatCurrency(raisedAmount)}</span>
              <span className="font-bold text-primary">{Math.min(progress, 100)}%</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.min(progress, 100)}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 + index * 0.1 }} className="h-full rounded-full gradient-gold" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
              <span>الهدف: {formatCurrency(goalAmount)}</span>
              <span>{donorsCount} متبرع</span>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDonation(true)}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              <Heart className="w-4 h-4" />
              تبرع الآن
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToBasket}
              className="py-3 px-4 rounded-xl border-2 border-primary text-primary font-bold text-sm flex items-center justify-center hover:bg-accent transition-colors active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <DonationModal open={showDonation} onOpenChange={setShowDonation} campaign={{ id: campaign.id, title }} />
    </>
  );
};

export default CampaignCard;
