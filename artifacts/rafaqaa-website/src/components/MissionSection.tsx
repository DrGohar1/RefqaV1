import { motion } from "framer-motion";
import { Target, Eye, Heart } from "lucide-react";

const MissionSection = () => {
  const items = [
    {
      icon: Target,
      title: "رسالتنا",
      desc: "تقديم خدمات التنمية والعمل الخيري بكفاءة وشفافية لمستحقيها، وفق رؤية إسلامية واعية تحقق العدالة الاجتماعية.",
    },
    {
      icon: Eye,
      title: "رؤيتنا",
      desc: "أن نكون المؤسسة الرائدة في العمل الخيري المستدام والمتكامل على مستوى الجمهورية.",
    },
    {
      icon: Heart,
      title: "قيمنا",
      desc: "الشفافية • الأمانة • الاحترافية • التكاتف • الابتكار في خدمة المجتمع.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-gold font-bold text-sm mb-2">من نحن</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">رسالتنا ورؤيتنا</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
              whileHover={{ y: -5 }}
              className="bg-card rounded-2xl p-8 shadow-card border border-border text-center hover:shadow-elevated transition-all"
            >
              <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-5">
                <item.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
