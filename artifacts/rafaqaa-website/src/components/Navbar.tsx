import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Menu, X, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";

const logoStamp = "/logo-stamp.jpg";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { flags } = useFeatureFlags();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/#campaigns", label: "الحملات" },
    { href: "/#services", label: "خدماتنا" },
    { href: "/#impact", label: "أثرنا" },
    ...(flags.zakat_calculator ? [{ href: "/zakat", label: "حاسبة الزكاة", isRoute: true }] : []),
    { href: "/track", label: "تتبع تبرعك", isRoute: true },
    { href: "/#contact", label: "تواصل معنا" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.img
            src={logoStamp}
            alt="شعار مؤسسة رفقاء البررة"
            className="w-10 h-10 rounded-xl object-cover shadow-sm"
            whileHover={{ scale: 1.1, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          />
          <div>
            <h1 className="font-display text-lg font-bold text-primary leading-tight group-hover:text-primary/80 transition-colors">رفقاء البررة</h1>
            <p className="text-[10px] text-muted-foreground">إشهار 7932 — وزارة التضامن</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {links.map((l) =>
            l.isRoute ? (
              <Link key={l.href} to={l.href} className="text-foreground hover:text-primary transition-colors">{l.label}</Link>
            ) : (
              <a key={l.href} href={l.href} className="text-foreground hover:text-primary transition-colors">{l.label}</a>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-muted transition-colors" aria-label="تبديل الوضع">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Admin link - only visible when logged in */}
          {user && (
            <Link to="/admin" className="p-2 rounded-xl hover:bg-muted transition-colors" title="لوحة التحكم">
              <User className="w-5 h-5" />
            </Link>
          )}

          {/* Hidden admin access - double-click on logo or go to /auth directly */}
          {/* Login button hidden from public view for security */}

          <motion.a
            href="#campaigns"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:inline-flex px-5 py-2.5 rounded-xl gradient-emerald text-primary-foreground text-sm font-bold shadow-card hover:shadow-elevated transition-shadow"
          >
            تبرع الآن
          </motion.a>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-card overflow-hidden"
          >
            <div className="container py-4 space-y-2">
              {links.map((l) =>
                l.isRoute ? (
                  <Link key={l.href} to={l.href} onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">{l.label}</Link>
                ) : (
                  <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">{l.label}</a>
                )
              )}
              <div className="pt-2 border-t border-border">
                <a
                  href="#campaigns"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-3 rounded-xl gradient-emerald text-primary-foreground text-sm font-bold"
                >
                  تبرع الآن
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
