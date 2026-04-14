import { useEffect, useState } from "react";
import { fetchSettings } from "@/lib/supabase-helpers";

const SeoHead = () => {
  const [seo, setSeo] = useState<any>(null);

  useEffect(() => {
    fetchSettings("seo")
      .then((data) => { if (data) setSeo(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!seo) return;
    if (seo.site_title) document.title = seo.site_title;
    const setMeta = (name: string, content: string, attr = "name") => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setMeta("description", seo.meta_description);
    setMeta("og:title", seo.site_title, "property");
    setMeta("og:description", seo.meta_description, "property");
    if (seo.og_image) setMeta("og:image", seo.og_image, "property");

    // Favicon / site icon
    if (seo.favicon_url) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = seo.favicon_url;
    }
  }, [seo]);

  return null;
};

export default SeoHead;
