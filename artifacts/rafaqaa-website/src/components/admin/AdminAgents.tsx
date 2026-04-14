import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus, Pencil, Trash2, X, Eye, EyeOff, UserCheck, UserX,
  MapPin, Phone, Hash, TrendingUp, Users, ClipboardList, BarChart3,
  CheckCircle2, Clock, AlertCircle, ChevronRight, RefreshCw, DollarSign
} from "lucide-react";

interface Agent {
  id: string; name: string; phone: string; zone?: string;
  username?: string; is_active: boolean; total_collected: string;
  notes?: string; created_at: string;
}

interface FieldOrder {
  id: string; donor_name: string; donor_phone: string;
  address?: string; zone?: string; amount: string;
  status: string; campaign_title?: string;
  agent_name?: string; created_at: string; collected_at?: string;
  notes?: string; preferred_time?: string;
}

const formatCurrency = (v: number | string) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(Number(v));

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: "معلق",    color: "bg-amber-100 text-amber-700",  icon: Clock },
  assigned:  { label: "مُسنَد",  color: "bg-blue-100 text-blue-700",    icon: UserCheck },
  collected: { label: "تم التحصيل", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "ملغي",   color: "bg-red-100 text-red-700",      icon: AlertCircle },
};

type TabType = "agents" | "orders" | "reports";

export default function AdminAgents() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabType>("agents");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", zone: "", username: "", password: "", notes: "" });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentOrders, setAgentOrders] = useState<FieldOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showCollectedEdit, setShowCollectedEdit] = useState<Agent | null>(null);
  const [newCollected, setNewCollected] = useState("");
  const [allOrders, setAllOrders] = useState<FieldOrder[]>([]);
  const [allOrdersLoading, setAllOrdersLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("pending");

  async function loadAgents() {
    setLoading(true);
    try { setAgents(await api.get<Agent[]>("/agents")); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function loadAgentOrders(agentId: string) {
    setOrdersLoading(true);
    try { setAgentOrders(await api.get<FieldOrder[]>(`/agents/${agentId}/orders`)); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setOrdersLoading(false); }
  }

  async function loadAllOrders() {
    setAllOrdersLoading(true);
    try { setAllOrders(await api.get<FieldOrder[]>("/field-orders")); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setAllOrdersLoading(false); }
  }

  async function updateOrderStatus(orderId: string, status: string, agentId?: string) {
    try {
      const body: any = { status };
      if (agentId) body.agent_id = agentId;
      await api.patch(`/field-orders/${orderId}`, body);
      toast({ title: status === "collected" ? "✅ تم تسجيل التحصيل" : status === "assigned" ? "✅ تم تعيين المندوب" : "تم التحديث" });
      loadAllOrders();
      if (selectedAgent) loadAgentOrders(selectedAgent.id);
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  async function deleteOrder(id: string) {
    if (!confirm("حذف هذا الطلب؟")) return;
    try { await api.delete(`/field-orders/${id}`); toast({ title: "تم الحذف" }); loadAllOrders(); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  useEffect(() => { loadAgents(); loadAllOrders(); }, []);
  useEffect(() => { if (selectedAgent) loadAgentOrders(selectedAgent.id); }, [selectedAgent]);

  function openCreate() {
    setEditAgent(null);
    setForm({ name: "", phone: "", zone: "", username: "", password: "", notes: "" });
    setShowPass(false); setShowForm(true);
  }
  function openEdit(a: Agent) {
    setEditAgent(a);
    setForm({ name: a.name, phone: a.phone, zone: a.zone || "", username: a.username || "", password: "", notes: a.notes || "" });
    setShowPass(false); setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.phone) { toast({ title: "الاسم والهاتف مطلوبان", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const body: any = { ...form };
      if (!body.password) delete body.password;
      if (editAgent) { await api.patch(`/agents/${editAgent.id}`, body); toast({ title: "تم التحديث" }); }
      else { await api.post("/agents", body); toast({ title: "تم إضافة المندوب" }); }
      setShowForm(false); loadAgents();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function toggleActive(a: Agent) {
    try { await api.patch(`/agents/${a.id}`, { is_active: !a.is_active }); toast({ title: a.is_active ? "تم إيقاف المندوب" : "تم تفعيل المندوب" }); loadAgents(); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  async function deleteAgent(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المندوب؟")) return;
    try { await api.delete(`/agents/${id}`); toast({ title: "تم الحذف" }); loadAgents(); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  async function saveCollected() {
    if (!showCollectedEdit || !newCollected) return;
    try {
      await api.patch(`/agents/${showCollectedEdit.id}/collected`, { amount: Number(newCollected) });
      toast({ title: "تم تحديث مبلغ التحصيل" });
      setShowCollectedEdit(null); setNewCollected(""); loadAgents();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  const totalCollected = agents.reduce((s, a) => s + Number(a.total_collected || 0), 0);
  const activeCount = agents.filter(a => a.is_active).length;
  const maxCollected = Math.max(...agents.map(a => Number(a.total_collected || 0)), 1);

  const tabs = [
    { id: "agents" as TabType, label: "المناديب", icon: Users },
    { id: "orders" as TabType, label: "الطلبات الميدانية", icon: ClipboardList },
    { id: "reports" as TabType, label: "تقارير الأداء", icon: BarChart3 },
  ];

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">إدارة المناديب الميدانيين</h2>
          <p className="text-muted-foreground text-sm mt-1">تتبع مناديب التحصيل الميداني وأداءهم</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><UserPlus className="w-4 h-4" />إضافة مندوب</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي المناديب", value: agents.length, icon: Users, color: "text-blue-500" },
          { label: "نشطون حالياً", value: activeCount, icon: UserCheck, color: "text-green-500" },
          { label: "إجمالي التحصيل", value: formatCurrency(totalCollected), icon: TrendingUp, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── TAB: AGENTS LIST ─── */}
        {tab === "agents" && (
          <motion.div key="agents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {loading ? (
              <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-card rounded-xl" />)}</div>
            ) : agents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">لا يوجد مناديب بعد</p>
                <p className="text-sm mt-1">اضغط "إضافة مندوب" لإنشاء أول مندوب ميداني</p>
              </div>
            ) : (
              agents.map(a => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`bg-card border border-border rounded-xl p-4 flex items-center gap-4 ${!a.is_active ? "opacity-60" : ""}`}>
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${a.is_active ? "bg-primary" : "bg-gray-400"}`}>
                    {a.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{a.name}</span>
                      {!a.is_active && <Badge variant="secondary" className="text-xs">موقوف</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</span>
                      {a.zone && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.zone}</span>}
                      {a.username && <span className="flex items-center gap-1"><Hash className="w-3 h-3" />@{a.username}</span>}
                      <button onClick={() => { setShowCollectedEdit(a); setNewCollected(a.total_collected); }}
                        className="flex items-center gap-1 text-primary font-medium hover:underline">
                        <TrendingUp className="w-3 h-3" />{formatCurrency(a.total_collected)}
                      </button>
                    </div>
                    {a.notes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="عرض الطلبات"
                      onClick={() => { setSelectedAgent(a); setTab("orders"); }}>
                      <ClipboardList className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleActive(a)}>
                      {a.is_active ? <UserX className="w-3.5 h-3.5 text-amber-500" /> : <UserCheck className="w-3.5 h-3.5 text-green-500" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteAgent(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ─── TAB: FIELD ORDERS ─── */}
        {tab === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Filter bar */}
            <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground ml-1">الحالة:</span>
              {[
                { value: "pending", label: "معلقة", color: "bg-amber-100 text-amber-700 border-amber-200" },
                { value: "assigned", label: "مُسنَدة", color: "bg-blue-100 text-blue-700 border-blue-200" },
                { value: "collected", label: "محصّلة", color: "bg-green-100 text-green-700 border-green-200" },
                { value: "cancelled", label: "ملغية", color: "bg-red-100 text-red-700 border-red-200" },
                { value: "", label: "الكل", color: "bg-muted text-muted-foreground border-border" },
              ].map(f => (
                <button key={f.value} onClick={() => setFilterStatus(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterStatus === f.value ? f.color + " ring-2 ring-offset-1 ring-primary/30" : "bg-muted border-border text-muted-foreground hover:border-primary/40"}`}>
                  {f.label} ({allOrders.filter(o => !f.value || o.status === f.value).length})
                </button>
              ))}
              <Button variant="ghost" size="sm" className="gap-1 h-7 ml-auto" onClick={loadAllOrders}>
                <RefreshCw className="w-3.5 h-3.5" />تحديث
              </Button>
            </div>

            {allOrdersLoading ? (
              <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-card rounded-xl" />)}</div>
            ) : allOrders.filter(o => !filterStatus || o.status === filterStatus).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>لا توجد طلبات بهذه الحالة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allOrders.filter(o => !filterStatus || o.status === filterStatus).map(o => {
                  const st = statusMap[o.status] || { label: o.status, color: "bg-gray-100 text-gray-600", icon: Clock };
                  const StIcon = st.icon;
                  return (
                    <div key={o.id} className="bg-card border border-border rounded-xl p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{o.donor_name}</p>
                          <p className="text-xs text-muted-foreground">{o.donor_phone}</p>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                            {o.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{o.address}</span>}
                            {o.zone && <span>{o.zone}</span>}
                            {o.campaign_title && <span className="text-primary/70">{o.campaign_title}</span>}
                            <span>{new Date(o.created_at).toLocaleDateString("ar-EG")}</span>
                          </div>
                          {o.agent_name && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">
                              <UserCheck className="w-3 h-3" /> مُسنَد لـ: {o.agent_name}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                            <StIcon className="w-3 h-3" />{st.label}
                          </span>
                          <p className="text-primary font-bold text-sm">{formatCurrency(o.amount)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/50">
                        {o.status === "pending" && (
                          <>
                            <select
                              onChange={e => { if (e.target.value) updateOrderStatus(o.id, "assigned", e.target.value); }}
                              className="h-7 px-2 rounded-lg text-xs border border-border bg-background"
                              defaultValue=""
                            >
                              <option value="">تعيين مندوب...</option>
                              {agents.filter(a => a.is_active).map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                          </>
                        )}
                        {o.status === "assigned" && (
                          <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                            onClick={() => updateOrderStatus(o.id, "collected")}>
                            <CheckCircle2 className="w-3 h-3" />تم التحصيل
                          </Button>
                        )}
                        {o.status !== "collected" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-red-500 hover:text-red-700"
                            onClick={() => updateOrderStatus(o.id, "cancelled")}>
                            <AlertCircle className="w-3 h-3" />إلغاء
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive ml-auto"
                          onClick={() => deleteOrder(o.id)}>
                          <Trash2 className="w-3 h-3" />حذف
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── TAB: REPORTS ─── */}
        {tab === "reports" && (
          <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {agents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>لا يوجد مناديب لعرض تقاريرهم</p>
              </div>
            ) : (
              <>
                {/* Ranking */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />ترتيب المناديب حسب التحصيل
                  </h3>
                  <div className="space-y-4">
                    {[...agents]
                      .sort((a, b) => Number(b.total_collected || 0) - Number(a.total_collected || 0))
                      .map((a, i) => {
                        const pct = Math.round((Number(a.total_collected || 0) / maxCollected) * 100);
                        const medals = ["🥇", "🥈", "🥉"];
                        return (
                          <div key={a.id}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{medals[i] || `#${i + 1}`}</span>
                                <div>
                                  <p className="font-bold text-sm">{a.name}</p>
                                  <p className="text-xs text-muted-foreground">{a.zone || "—"}</p>
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-primary">{formatCurrency(a.total_collected)}</p>
                                {!a.is_active && <Badge variant="secondary" className="text-xs">موقوف</Badge>}
                              </div>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700 ${i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-600" : "bg-primary"}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-xl font-bold">{formatCurrency(totalCollected)}</p>
                    <p className="text-xs text-muted-foreground">إجمالي التحصيل</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <p className="text-xl font-bold">{agents.length > 0 ? formatCurrency(totalCollected / agents.length) : "—"}</p>
                    <p className="text-xs text-muted-foreground">متوسط التحصيل / مندوب</p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{editAgent ? "تعديل المندوب" : "إضافة مندوب جديد"}</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1 block">الاسم *</label>
                    <Input placeholder="اسم المندوب" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div><label className="text-sm font-medium mb-1 block">رقم الهاتف *</label>
                    <Input placeholder="01xxxxxxxxx" dir="ltr" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                </div>
                <div><label className="text-sm font-medium mb-1 block">المنطقة / الحي</label>
                  <Input placeholder="مثال: مدينة نصر، الزيتون" value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1 block">اسم المستخدم</label>
                    <Input placeholder="للدخول للبوابة" dir="ltr" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></div>
                  <div><label className="text-sm font-medium mb-1 block">{editAgent ? "كلمة مرور جديدة" : "كلمة المرور"}</label>
                    <div className="relative">
                      <Input type={showPass ? "text" : "password"} placeholder="اختياري" dir="ltr"
                        value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-2.5 text-muted-foreground">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div><label className="text-sm font-medium mb-1 block">ملاحظات</label>
                  <Input placeholder="ملاحظات إضافية" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                <Button onClick={save} disabled={saving}>{saving ? "..." : editAgent ? "تحديث" : "إضافة"}</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Collected Modal */}
        {showCollectedEdit && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">تعديل مبلغ التحصيل</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowCollectedEdit(null)}><X className="w-4 h-4" /></Button>
              </div>
              <p className="text-sm text-muted-foreground">المندوب: <span className="font-bold text-foreground">{showCollectedEdit.name}</span></p>
              <div>
                <label className="text-sm font-medium mb-1 block">إجمالي التحصيل (جنيه)</label>
                <Input type="number" placeholder="0" dir="ltr" value={newCollected} onChange={e => setNewCollected(e.target.value)} />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowCollectedEdit(null)}>إلغاء</Button>
                <Button onClick={saveCollected}>حفظ</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
