import React, { createContext, useContext, useState, useCallback } from "react";
import { Campaign } from "@/data/campaigns";

export interface BasketItem {
  campaign: Campaign;
  amount: number;
}

interface BasketContextType {
  items: BasketItem[];
  addItem: (campaign: Campaign, amount: number) => void;
  removeItem: (campaignId: string) => void;
  updateAmount: (campaignId: string, amount: number) => void;
  clearBasket: () => void;
  totalAmount: number;
  itemCount: number;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export const BasketProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<BasketItem[]>([]);

  const addItem = useCallback((campaign: Campaign, amount: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.campaign.id === campaign.id);
      if (existing) {
        return prev.map((i) =>
          i.campaign.id === campaign.id ? { ...i, amount: i.amount + amount } : i
        );
      }
      return [...prev, { campaign, amount }];
    });
  }, []);

  const removeItem = useCallback((campaignId: string) => {
    setItems((prev) => prev.filter((i) => i.campaign.id !== campaignId));
  }, []);

  const updateAmount = useCallback((campaignId: string, amount: number) => {
    setItems((prev) =>
      prev.map((i) => (i.campaign.id === campaignId ? { ...i, amount } : i))
    );
  }, []);

  const clearBasket = useCallback(() => setItems([]), []);

  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
  const itemCount = items.length;

  return (
    <BasketContext.Provider value={{ items, addItem, removeItem, updateAmount, clearBasket, totalAmount, itemCount }}>
      {children}
    </BasketContext.Provider>
  );
};

export const useBasket = () => {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used within BasketProvider");
  return ctx;
};
