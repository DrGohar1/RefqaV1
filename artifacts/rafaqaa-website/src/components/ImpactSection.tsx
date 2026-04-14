import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { fetchSettings } from "@/lib/supabase-helpers";

interface Story {
  title: string;
  desc: string;
  image: string;
  amount: string;
}

const defaultStories: Story[] = [
  { title: "توزيع 500 كرتونة رمضان", desc: "تم توزيع كراتين المواد الغذائية على الأسر الأكثر احتياجاً في القرى", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&q=80", amount: "١٥٠,٠٠٠ ج.م" },
  { title: "كفالة ٥٠ يتيماً", desc: "كفالة شهرية مستمرة لخمسين يتيماً تشمل المعيشة والتعليم", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&q=80", amount: "٣٠٠,٠٠٠ ج.م" },
  { title: "قافلة طبية في الصعيد", desc: "علاج ٢٠٠ حالة وإجراء ١٥ عملية جراحية مجاناً", image: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&q=80", amount: "٢٢٠,٠٠٠ ج.م" },
];

const ImpactSection = () => {
  const [stories, setStories] = useState<Story[]>(defaultStories);

  useEffect(() => {
    fetchSettings("success_stories")
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) setStories(data as unknown as Story[]);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="impact" className="py-20 bg-cream pattern-islamic">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <p className="text-gold font-bold text-sm mb-2">الشفافية والمصداقية</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">قصص نجاح حقيقية</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">نؤمن بالشفافية الكاملة - هذه بعض المشاريع التي أنجزناها بفضل تبرعاتكم</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stories.map((story, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
              whileHover={{ y: -8 }}
              className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all"
            >
              <div className="relative h-48 overflow-hidden">
                <motion.img src={story.image} alt={story.title} className="w-full h-full object-cover" whileHover={{ scale: 1.1 }} transition={{ duration: 0.5 }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-bold backdrop-blur-sm">
                  <CheckCircle2 className="w-3 h-3" /> مكتمل
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{story.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{story.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">إجمالي التبرعات</span>
                  <span className="font-bold text-gold">{story.amount}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
