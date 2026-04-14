import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CampaignCard from "./CampaignCard";
import { fetchCampaigns } from "@/lib/supabase-helpers";

const CampaignsSection = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns()
      .then((data) => setCampaigns(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="campaigns" className="py-20 bg-cream pattern-islamic">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-gold font-bold text-sm mb-2 tracking-wide">أبواب الخير</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">حملات التبرع النشطة</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">اختر المجال الذي يقرّبك إلى الله وساهم بما تستطيع</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.filter(c => c.status === 'active').map((campaign, i) => (
              <CampaignCard key={campaign.id} campaign={campaign} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CampaignsSection;
