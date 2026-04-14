import { Phone, MessageCircle, MapPin, Mail, Facebook, Instagram, Youtube, Twitter, ExternalLink, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useSocialLinks } from "@/contexts/SocialLinksContext";
import logoStamp from "@/assets/logo-stamp.jpg";

const socialIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
};

const socialLabels: Record<string, string> = {
  facebook: "فيسبوك",
  instagram: "إنستجرام",
  youtube: "يوتيوب",
  twitter: "تويتر / X",
  tiktok: "تيك توك",
  linkedin: "لينكدإن",
};

const Footer = () => {
  const { links } = useSocialLinks();

  const activeSocials = [
    { key: "facebook", url: links.facebook },
    { key: "instagram", url: links.instagram },
    { key: "youtube", url: links.youtube },
    { key: "twitter", url: links.twitter },
    { key: "tiktok", url: links.tiktok },
    { key: "linkedin", url: links.linkedin },
  ].filter(s => s.url);

  const waUrl = links.whatsapp
    ? `https://wa.me/${links.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(links.whatsapp_message || "السلام عليكم")}`
    : "https://wa.me/201130925036";

  return (
    <footer id="contact" className="bg-[#0a1628] text-white">
      <div className="container py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoStamp} alt="الشعار" className="w-12 h-12 rounded-xl object-cover opacity-90" />
              <div>
                <h3 className="font-display text-xl font-bold text-white">رفقاء البررة</h3>
                <p className="text-white/50 text-xs">إشهار رقم 7932</p>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              مؤسسة تابعة لوزارة التضامن الاجتماعي تعمل في مجالات التنمية والخدمات الدينية والاجتماعية.
            </p>
            {activeSocials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeSocials.map(s => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    title={socialLabels[s.key] || s.key}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/70 hover:text-white"
                  >
                    {socialIcons[s.key] || <ExternalLink className="w-4 h-4" />}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-base font-bold mb-4 text-white">روابط سريعة</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="#campaigns" className="hover:text-[#D4AF37] transition-colors">حملات التبرع</a></li>
              <li><a href="#services" className="hover:text-[#D4AF37] transition-colors">خدماتنا</a></li>
              <li><a href="#impact" className="hover:text-[#D4AF37] transition-colors">قصص النجاح</a></li>
              <li><Link to="/zakat" className="hover:text-[#D4AF37] transition-colors">حاسبة الزكاة</Link></li>
              <li>
                <Link to="/track" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                  <Search className="w-3 h-3" /> تتبع تبرعك
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-display text-base font-bold mb-4 text-white">السياسات</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/policy" className="hover:text-[#D4AF37] transition-colors">سياسة الخصوصية</Link></li>
              <li><Link to="/policy" className="hover:text-[#D4AF37] transition-colors">شروط الاستخدام</Link></li>
              <li><Link to="/policy" className="hover:text-[#D4AF37] transition-colors">سياسة الاسترداد</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-base font-bold mb-4 text-white">تواصل معنا</h4>
            <div className="space-y-3 text-sm">
              {links.phone && (
                <a href={`tel:${links.phone}`} className="flex items-center gap-3 text-white/60 hover:text-[#D4AF37] transition-colors">
                  <Phone className="w-4 h-4 shrink-0" /> {links.phone}
                </a>
              )}
              <a href={waUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-white/60 hover:text-[#D4AF37] transition-colors">
                <MessageCircle className="w-4 h-4 shrink-0" /> واتساب مباشر
              </a>
              {links.email && (
                <a href={`mailto:${links.email}`} className="flex items-center gap-3 text-white/60 hover:text-[#D4AF37] transition-colors">
                  <Mail className="w-4 h-4 shrink-0" /> {links.email}
                </a>
              )}
              <div className="flex items-center gap-3 text-white/60">
                <MapPin className="w-4 h-4 shrink-0" /> {links.address || "جمهورية مصر العربية"}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <div className="text-center md:text-right">
            <p>© {new Date().getFullYear()} مؤسسة رفقاء البررة للتنمية والخدمات الدينية والاجتماعية — جميع الحقوق محفوظة</p>
            <p className="mt-1">مرخصة من وزارة التضامن الاجتماعي | رقم الإشهار 7932</p>
          </div>
          <div className="text-center">
            {links.developer_url ? (
              <a href={links.developer_url} target="_blank" rel="noreferrer" className="hover:text-white/70 transition-colors">
                تصميم وبرمجة <span className="text-[#D4AF37] font-bold">{links.developer_name || "GOHAR DEV"}</span>
              </a>
            ) : (
              <p>تصميم وبرمجة <span className="text-[#D4AF37] font-bold">{links.developer_name || "GOHAR DEV"}</span></p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
