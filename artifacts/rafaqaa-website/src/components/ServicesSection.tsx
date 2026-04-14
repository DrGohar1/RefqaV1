import { motion } from "framer-motion";
import { Coins, Users, UtensilsCrossed, Stethoscope, Home, BookOpen } from "lucide-react";

const services = [
  { icon: Coins, title: "الزكاة والصدقات", desc: "طهّر مالك وبارك فيه", color: "from-primary/20 to-primary/5" },
  { icon: Users, title: "كفالة الأيتام", desc: "كن رفيق النبي ﷺ في الجنة", color: "from-gold/20 to-gold/5" },
  { icon: UtensilsCrossed, title: "إطعام الطعام", desc: "اللقمة تفك كربة", color: "from-primary/20 to-primary/5" },
  { icon: Stethoscope, title: "الرعاية الصحية", desc: "ساهم في شفاء مريض", color: "from-gold/20 to-gold/5" },
  { icon: Home, title: "إغاثة الأسر", desc: "ارفع المعاناة عن المحتاجين", color: "from-primary/20 to-primary/5" },
  { icon: BookOpen, title: "التعليم والتأهيل", desc: "علّم إنساناً وغيّر حياته", color: "from-gold/20 to-gold/5" },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-gold font-bold text-sm mb-2">مجالات عملنا</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">خدماتنا</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {services.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`group p-6 rounded-2xl bg-gradient-to-br ${s.color} backdrop-blur-sm shadow-card hover:shadow-elevated transition-all text-center border border-border/50`}
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="w-14 h-14 rounded-xl bg-card flex items-center justify-center mx-auto mb-4 shadow-sm"
              >
                <s.icon className="w-7 h-7 text-primary" />
              </motion.div>
              <h3 className="font-display text-lg font-bold text-foreground mb-1">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
