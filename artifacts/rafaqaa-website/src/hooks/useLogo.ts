import { useState, useEffect } from "react";

const LOGO_FALLBACK = "/logo-stamp.png";
let cachedLogoUrl: string | null = null;
const listeners: Array<(url: string) => void> = [];

export function notifyLogoChange(url: string) {
  cachedLogoUrl = url;
  listeners.forEach(fn => fn(url));
}

export function useLogo() {
  const [logoUrl, setLogoUrl] = useState<string>(cachedLogoUrl || LOGO_FALLBACK);

  useEffect(() => {
    listeners.push(setLogoUrl);
    if (!cachedLogoUrl) {
      fetch("/api/uploads/logo/current")
        .then(r => r.json())
        .then(d => {
          if (d.url) {
            cachedLogoUrl = d.url;
            listeners.forEach(fn => fn(d.url));
          }
        })
        .catch(() => {});
    }
    return () => {
      const idx = listeners.indexOf(setLogoUrl);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return logoUrl;
}
