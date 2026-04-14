import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchSettings } from "@/lib/supabase-helpers";

interface FeatureFlags {
  site_disabled: boolean;
  site_disabled_message: string;
  manual_payments: boolean;
  basket_system: boolean;
  sms_notifications: boolean;
  api_payments: boolean;
  home_delivery: boolean;
  agent_donations: boolean;
  reports: boolean;
  guest_donations: boolean;
  recurring_donations: boolean;
  zakat_calculator: boolean;
  donation_ticker: boolean;
  [key: string]: boolean | string;
}

const defaults: FeatureFlags = {
  site_disabled: false,
  site_disabled_message: "الموقع في وضع الصيانة، يرجى المحاولة لاحقاً",
  manual_payments: true,
  basket_system: true,
  sms_notifications: false,
  api_payments: false,
  home_delivery: true,
  agent_donations: true,
  reports: true,
  guest_donations: true,
  recurring_donations: false,
  zakat_calculator: true,
  donation_ticker: true,
};

const FeatureFlagsContext = createContext<{
  flags: FeatureFlags;
  loading: boolean;
  refreshFlags: () => Promise<void>;
}>({
  flags: defaults,
  loading: false,
  refreshFlags: async () => {},
});

export const FeatureFlagsProvider = ({ children }: { children: React.ReactNode }) => {
  const [flags, setFlags] = useState<FeatureFlags>(defaults);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSettings("feature_flags");
      if (data) setFlags({ ...defaults, ...(data as any) });
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, refreshFlags: load }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => useContext(FeatureFlagsContext);
