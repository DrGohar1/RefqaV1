import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileCheck, BarChart3, CreditCard, UserCog, Settings,
  Shield, ChevronDown, ChevronLeft, ScrollText, LogOut, ArrowRight,
  Clock, CheckCircle2, XCircle, Globe, Bell, Menu, X, Megaphone,
  Users2, Home, Truck, BotMessageSquare, Mail, Phone, Search,
  ShieldCheck, Database, Banknote, FileText, Activity, Star, Layers
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AdminDonations from "@/components/admin/AdminDonations";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminCampaigns from "@/components/admin/AdminCampaigns";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminBanners from "@/components/admin/AdminBanners";
import AdminAgents from "@/components/admin/AdminAgents";
import AdminFieldOrders from "@/components/admin/AdminFieldOrders";
import AdminSecurity from "@/components/admin/AdminSecurity";
import AdminAuditLogs from "@/components/admin/AdminAuditLogs";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminPaymentSettings from "@/components/admin/AdminPaymentSettings";
import AdminPaymentGateway from "@/components/admin/AdminPaymentGateway";
import AdminSuccessStories from "@/components/admin/AdminSuccessStories";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminSEO from "@/components/admin/AdminSEO";
import AdminBackup from "@/components/admin/AdminBackup";
import logoStamp from "@/assets/logo-stamp.jpg";

type Tab =
  | "dashboard"
  | "donations" | "donations-pending" | "donations-approved" | "donations-rejected"
  | "gateway-all" | "gateway-pending" | "gateway-approved" | "gateway-rejected" | "gateway-reports" | "gateway-settings"
  | "payments" | "agents" | "field-orders"
  | "campaigns" | "success-stories"
  | "notifications"
  | "seo" | "backup"
  | "users" | "banners" | "security" | "audit-logs" | "settings";

interface SidebarItem { id: Tab; label: string; icon: any; badge?: number; color?: string }
interface SidebarGroup { id: string; label: string; icon: any; color?: string; children: SidebarItem[] }

const sidebarGroups: SidebarGroup[] = [
  {
    id: "main",
    label: "الرئيسية",
    icon: LayoutDashboard,
    children: [
      { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    ],
  },
  {
    id: "donations-group",
    label: "التبرعات والمدفوعات",
    icon: FileCheck,
    color: "text-emerald-500",
    children: [
      { id: "donations",          label: "جميع التبرعات",         icon: FileCheck, color: "text-foreground" },
      { id: "donations-pending",  label: "قيد المراجعة",          icon: Clock,         color: "text-amber-500" },
      { id: "donations-approved", label: "التبرعات المعتمدة",     icon: CheckCircle2,  color: "text-emerald-500" },
      { id: "donations-rejected", label: "التبرعات المرفوضة",     icon: XCircle,       color: "text-red-500" },
      { id: "gateway-all",        label: "دفع إلكتروني — كل العمليات", icon: CreditCard, color: "text-blue-500" },
      { id: "gateway-pending",    label: "إلكتروني — قيد المراجعة",   icon: Clock },
      { id: "gateway-approved",   label: "إلكتروني — المعتمدة",       icon: CheckCircle2 },
      { id: "gateway-settings",   label: "إعدادات بوابة الدفع",       icon: Settings },
      { id: "payments",           label: "بوابات الدفع اليدوي",        icon: Banknote },
      { id: "agents",             label: "المناديب الميدانيون",        icon: Users2 },
      { id: "field-orders",       label: "طلبات التحصيل",             icon: Home },
    ],
  },
  {
    id: "campaigns-group",
    label: "الحملات والمحتوى",
    icon: BarChart3,
    color: "text-purple-500",
    children: [
      { id: "campaigns",       label: "إدارة الحملات",  icon: BarChart3 },
      { id: "success-stories", label: "قصص النجاح",    icon: Star },
      { id: "banners",         label: "البانرات",       icon: Megaphone },
    ],
  },
  {
    id: "system-group",
    label: "الإعدادات والنظام",
    icon: Settings,
    color: "text-gray-400",
    children: [
      { id: "notifications", label: "الإشعارات والتواصل",   icon: Bell },
      { id: "seo",           label: "SEO وتحسين البحث",    icon: Globe },
      { id: "users",         label: "إدارة المستخدمين",    icon: UserCog },
      { id: "settings",      label: "الإعدادات العامة",    icon: Settings },
      { id: "security",      label: "الحماية والأمان",     icon: Shield },
      { id: "audit-logs",    label: "سجل العمليات",        icon: ScrollText },
      { id: "backup",        label: "نسخ احتياطي",        icon: Database },
    ],
  },
];

const TAB_TITLES: Partial<Record<Tab, string>> = {
  dashboard: "لوحة التحكم",
  donations: "جميع التبرعات",
  "donations-pending": "تبرعات قيد المراجعة",
  "donations-approved": "التبرعات المعتمدة",
  "donations-rejected": "التبرعات المرفوضة",
  "gateway-all": "الدفع الإلكتروني — كل العمليات",
  "gateway-pending": "الدفع الإلكتروني — قيد المراجعة",
  "gateway-approved": "الدفع الإلكتروني — المعتمدة",
  "gateway-rejected": "الدفع الإلكتروني — المرفوضة",
  "gateway-reports": "التقارير المالية",
  "gateway-settings": "إعدادات بوابة الدفع الإلكتروني",
  payments: "بوابات الدفع اليدوي",
  agents: "المناديب الميدانيون",
  "field-orders": "طلبات التحصيل الميداني",
  campaigns: "إدارة الحملات",
  "success-stories": "قصص النجاح",
  banners: "البانرات الترويجية",
  notifications: "الإشعارات والتواصل",
  seo: "SEO وتحسين محركات البحث",
  backup: "النسخ الاحتياطي والاسترداد",
  users: "إدارة المستخدمين والأدوار",
  security: "الحماية والأمان",
  "audit-logs": "سجل العمليات التفصيلي",
  settings: "الإعدادات العامة",
};

const GATEWAY_TAB_MAP: Partial<Record<Tab, "all" | "pending" | "approved" | "rejected" | "reports">> = {
  "gateway-all": "all",
  "gateway-pending": "pending",
  "gateway-approved": "approved",
  "gateway-rejected": "rejected",
  "gateway-reports": "reports",
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(["main", "donations-group"]);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  useEffect(() => {
    if (!loading && !user) { navigate("/auth"); return; }
    if (!loading && user && !isAdmin) { navigate("/"); }
  }, [user, loading, navigate, isAdmin]);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const donationFilter = activeTab.startsWith("donations-")
    ? activeTab.replace("donations-", "") as "pending" | "approved" | "rejected"
    : undefined;

  const gatewaySubTab = GATEWAY_TAB_MAP[activeTab];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-muted-foreground font-display text-lg">
          جاري التحقق من الصلاحيات...
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoStamp} alt="الشعار" className="w-10 h-10 rounded-xl object-cover shrink-0 ring-2 ring-sidebar-primary/30" />
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-sidebar-foreground truncate">لوحة الإدارة</h2>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">رفقاء البررة — إشهار 7932</p>
            </div>
          )}
        </div>
      </div>

      {/* User badge */}
      {!collapsed && user && (
        <div className="px-4 py-2.5 border-b border-sidebar-border bg-sidebar-accent/30">
          <p className="text-[11px] text-sidebar-foreground/50">تسجيل دخول كـ</p>
          <p className="text-xs font-bold text-sidebar-foreground truncate">{user.username || user.email}</p>
          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">{user.role === "admin" ? "مدير" : "مشرف"}</span>
        </div>
      )}

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {sidebarGroups.map(group => (
          <div key={group.id} className="mb-1">
            {/* Group header */}
            <button
              onClick={() => !collapsed && toggleGroup(group.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-sidebar-accent transition-colors"
            >
              {collapsed ? (
                <group.icon className={`w-5 h-5 mx-auto ${group.color || "text-sidebar-foreground/50"}`} />
              ) : (
                <>
                  <group.icon className={`w-4 h-4 shrink-0 ${group.color || "text-sidebar-foreground/50"}`} />
                  <span className={`flex-1 text-right text-[11px] font-bold uppercase tracking-wider ${group.color || "text-sidebar-foreground/40"}`}>{group.label}</span>
                  <ChevronDown className={`w-3 h-3 text-sidebar-foreground/40 transition-transform ${openGroups.includes(group.id) ? "rotate-180" : ""}`} />
                </>
              )}
            </button>

            {/* Group items */}
            <AnimatePresence initial={false}>
              {(collapsed || openGroups.includes(group.id)) && (
                <motion.div
                  initial={collapsed ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pt-0.5">
                    {group.children.map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                        title={collapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-2.5 rounded-xl text-sm transition-all ${
                          activeTab === item.id
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-bold shadow-lg shadow-sidebar-primary/20 px-3 py-2"
                            : `text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground py-1.5 ${collapsed ? "px-3 justify-center" : "px-3 pr-7"}`
                        }`}
                      >
                        <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? "" : (item.color || "")}`} />
                        {!collapsed && <span className="truncate text-xs">{item.label}</span>}
                        {!collapsed && item.badge && item.badge > 0 && (
                          <span className="mr-auto min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                            {item.badge > 9 ? "9+" : item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <a
          href="/"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          <ArrowRight className="w-4 h-4 shrink-0" />
          {!collapsed && <span>العودة للموقع</span>}
        </a>
        <button
          onClick={signOut}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background font-body flex" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className={`${collapsed ? "w-[64px]" : "w-[250px]"} bg-sidebar hidden md:flex flex-col transition-all duration-300 shrink-0 relative border-l border-sidebar-border`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -left-3 top-16 z-10 w-6 h-6 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 right-4 z-50 md:hidden w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 md:hidden"
            />
            <motion.aside
              initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed top-0 right-0 bottom-0 w-[270px] z-50 bg-sidebar flex flex-col md:hidden border-l border-sidebar-border"
            >
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 left-4 text-sidebar-foreground/60">
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Topbar */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold truncate">{TAB_TITLES[activeTab] || "لوحة التحكم"}</h1>
            <p className="text-xs text-muted-foreground truncate">{user?.username || user?.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

            {activeTab === "dashboard" && <AdminAnalytics />}

            {/* ── Donations ── */}
            {(activeTab === "donations" || activeTab.startsWith("donations-")) && (
              <AdminDonations filterStatus={donationFilter} />
            )}

            {/* ── Online Gateway ── */}
            {activeTab.startsWith("gateway-") && activeTab !== "gateway-settings" && (
              <AdminPaymentGateway key={activeTab} initialTab={gatewaySubTab} />
            )}
            {activeTab === "gateway-settings" && <AdminPaymentSettings />}

            {/* ── Manual & Field ── */}
            {activeTab === "payments"     && <AdminPayments />}
            {activeTab === "agents"       && <AdminAgents />}
            {activeTab === "field-orders" && <AdminFieldOrders />}

            {/* ── Campaigns ── */}
            {activeTab === "campaigns"       && <AdminCampaigns />}
            {activeTab === "success-stories" && <AdminSuccessStories />}
            {activeTab === "banners"         && <AdminBanners />}

            {/* ── System ── */}
            {activeTab === "notifications" && <AdminNotifications />}
            {activeTab === "seo"           && <AdminSEO />}
            {activeTab === "users"         && <AdminUsers />}
            {activeTab === "settings"      && <AdminSettings />}
            {activeTab === "security"      && <AdminSecurity />}
            {activeTab === "audit-logs"    && <AdminAuditLogs />}
            {activeTab === "backup"        && <AdminBackup />}

          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
