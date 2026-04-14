import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api-client";

export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  twitter: string;
  tiktok: string;
  linkedin: string;
  whatsapp: string;
  phone: string;
  whatsapp_message: string;
  address: string;
  email: string;
  developer_name: string;
  developer_url: string;
}

const defaults: SocialLinks = {
  facebook: "",
  instagram: "",
  youtube: "",
  twitter: "",
  tiktok: "",
  linkedin: "",
  whatsapp: "201130925036",
  phone: "01130925036",
  whatsapp_message: "السلام عليكم، أريد الاستفسار عن التبرع",
  address: "جمهورية مصر العربية",
  email: "",
  developer_name: "GOHAR DEV",
  developer_url: "",
};

const SocialLinksContext = createContext<{ links: SocialLinks; loading: boolean; refetch: () => void }>({
  links: defaults,
  loading: false,
  refetch: () => {},
});

export const SocialLinksProvider = ({ children }: { children: React.ReactNode }) => {
  const [links, setLinks] = useState<SocialLinks>(defaults);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ value: SocialLinks }>("/settings/social_links");
      if (data?.value) setLinks({ ...defaults, ...data.value });
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <SocialLinksContext.Provider value={{ links, loading, refetch: fetch }}>
      {children}
    </SocialLinksContext.Provider>
  );
};

export const useSocialLinks = () => useContext(SocialLinksContext);
