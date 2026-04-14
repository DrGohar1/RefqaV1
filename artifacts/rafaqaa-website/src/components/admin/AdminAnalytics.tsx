import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { fetchDonations, fetchCampaigns } from "@/lib/supabase-helpers";
import { TrendingUp, Users, DollarSign, Clock, FileCheck, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["hsl(178,100%,23%)", "hsl(43,76%,52%)", "hsl(178,60%,40%)", "hsl(15,70%,55%)", "hsl(210,50%,40%)", "hsl(40,30%,95%)"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount);

const AdminAnalytics = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, c] = await Promise.all([fetchDonations(), fetchCampaigns()]);
        setDonations(d || []);
        setCampaigns(c || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const approved = donations.filter((d) => d.status === "approved");
  const pending = donations.filter((d) => d.status === "pending");
  const totalApproved = approved.reduce((s, d) => s + Number(d.amount), 0);
  const totalPending = pending.reduce((s, d) => s + Number(d.amount), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const uniqueDonors = new Set(donations.map((d) => d.donor_phone)).size;

  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    campaigns.forEach((c) => {
      const cat = c.category || "أخرى";
      catMap[cat] = (catMap[cat] || 0) + Number(c.raised_amount || 0);
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [campaigns]);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    approved.forEach((d) => {
      const date = new Date(d.created_at);
      const key = monthNames[date.getMonth()];
      months[key] = (months[key] || 0) + Number(d.amount);
    });
    return Object.entries(months).map(([name, amount]) => ({ name, amount }));
  }, [approved]);

  const stats = [
    { label: "إجمالي التبرعات المعتمدة", value: formatCurrency(totalApproved), icon: DollarSign, color: "bg-primary/10 text-primary" },
    { label: "تبرعات قيد المراجعة", value: formatCurrency(totalPending), icon: Clock, color: "bg-gold/10 text-gold-dark" },
    { label: "عدد المتبرعين الفريدين", value: uniqueDonors, icon: Users, color: "bg-accent text-accent-foreground" },
    { label: "حملات نشطة", value: activeCampaigns, icon: TrendingUp, color: "bg-primary/10 text-primary" },
    { label: "إجمالي الإيصالات", value: donations.length, icon: FileCheck, color: "bg-gold/10 text-gold-dark" },
    { label: "حملات مكتملة", value: campaigns.filter((c) => c.status === "completed").length, icon: BarChart3, color: "bg-accent text-accent-foreground" },
  ];

  if (loading) return <div className="animate-pulse space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-card rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">لوحة التحكم</h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl p-4 shadow-card border border-border"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-5 shadow-card border border-border">
          <h3 className="font-display text-lg font-bold mb-4">الدخل الشهري</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(180,15%,88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="amount" fill="hsl(178,100%,23%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card border border-border">
          <h3 className="font-display text-lg font-bold mb-4">أداء التصنيفات</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name }) => name}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Recent donations */}
      <div className="bg-card rounded-xl p-5 shadow-card border border-border">
        <h3 className="font-display text-lg font-bold mb-4">آخر التبرعات</h3>
        {donations.slice(0, 5).length > 0 ? (
          <div className="space-y-2">
            {donations.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
                <div>
                  <p className="font-bold">{d.donor_name}</p>
                  <p className="text-xs text-muted-foreground">{d.campaign_title}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-primary">{formatCurrency(Number(d.amount))}</p>
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("ar-EG")}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">لا توجد تبرعات بعد</div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
