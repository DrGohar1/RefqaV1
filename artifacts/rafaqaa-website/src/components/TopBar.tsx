import { Phone, Facebook, Instagram, Youtube, Twitter } from "lucide-react";
import { useSocialLinks } from "@/contexts/SocialLinksContext";

const iconMap: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-3.5 h-3.5" />,
  instagram: <Instagram className="w-3.5 h-3.5" />,
  youtube: <Youtube className="w-3.5 h-3.5" />,
  twitter: <Twitter className="w-3.5 h-3.5" />,
};

const TopBar = () => {
  const { links } = useSocialLinks();

  const socials = [
    { key: "facebook", url: links.facebook },
    { key: "instagram", url: links.instagram },
    { key: "youtube", url: links.youtube },
    { key: "twitter", url: links.twitter },
  ].filter(s => s.url);

  return (
    <div className="bg-[#0a1628] text-white/90 text-xs py-1.5">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="opacity-80">مؤسسة مرخصة | إشهار رقم 7932 - وزارة التضامن الاجتماعي</span>
        </div>
        <div className="flex items-center gap-3">
          {links.phone && (
            <a href={`tel:${links.phone}`} className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
              <Phone className="w-3 h-3" />
              <span className="hidden sm:inline">{links.phone}</span>
            </a>
          )}
          {socials.length > 0 && (
            <div className="flex items-center gap-2 mr-3">
              {socials.map(s => (
                <a key={s.key} href={s.url} target="_blank" rel="noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                  {iconMap[s.key]}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
