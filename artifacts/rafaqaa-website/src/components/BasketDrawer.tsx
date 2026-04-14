import { motion, AnimatePresence } from "framer-motion";
import { useBasket } from "@/contexts/BasketContext";
import { formatCurrency } from "@/data/campaigns";
import { ShoppingCart, Trash2, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import DonationModal from "./DonationModal";

const BasketDrawer = () => {
  const { items, removeItem, updateAmount, totalAmount, itemCount, clearBasket } = useBasket();
  const [isOpen, setIsOpen] = useState(false);
  const [showDonation, setShowDonation] = useState(false);

  if (itemCount === 0 && !isOpen) return null;

  return (
    <>
      {/* Floating basket button */}
      <AnimatePresence>
        {itemCount > 0 && !isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 left-6 z-40 w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center">
              {itemCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed top-0 right-0 z-50 w-full max-w-sm h-full bg-card shadow-elevated flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  سلة التبرعات ({itemCount})
                </h3>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>سلتك فارغة</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <motion.div key={item.campaign.id} layout className="bg-muted rounded-xl p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-sm flex-1">{item.campaign.title}</h4>
                        <button onClick={() => removeItem(item.campaign.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateAmount(item.campaign.id, Number(e.target.value) || 0)}
                          className="h-8 text-sm font-bold text-center"
                          dir="ltr"
                          min={1}
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">جنيه</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">الإجمالي</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                  <Button onClick={() => { setIsOpen(false); setShowDonation(true); }} className="w-full gap-2 gradient-gold text-secondary-foreground font-bold py-6">
                    <Heart className="w-5 h-5" />
                    إتمام التبرع
                  </Button>
                  <button onClick={clearBasket} className="w-full text-sm text-destructive hover:underline">
                    تفريغ السلة
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DonationModal open={showDonation} onOpenChange={setShowDonation} />
    </>
  );
};

export default BasketDrawer;
