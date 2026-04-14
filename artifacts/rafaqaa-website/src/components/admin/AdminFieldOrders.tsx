import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Home, Users, MapPin, Phone, Clock, CheckCircle2, XCircle,
  Truck, RefreshCw, Search, UserCheck, Eye, X, MessageCircle
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "انتظار", color: "bg-amber-500/10 text-amber-600", icon: Clock },
  assigned: { label: "تم التعيين", color: "bg-blue-500/10 text-blue-600", icon: Truck },
  collected: { label: "تم التحصيل", color: "bg-primary/10 text-primary", icon: CheckCircle2 },
  failed: { label: "فشل", color: "bg-destructive/10 text-destructive", icon: XCircle },
  cancelled: { label: "ملغي", color: "bg-gray-500/10 text-gray-500", icon: X },
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  home_delivery: "دفع منزلي",
  agent: "طلب مندوب",
};

const formatCurrency = (v: number | string) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(Number(v));

interface FieldOrder {
  id: string; order_type: string; donor_name: string; donor_phone: string;
  address?: string; zone?: string; preferred_time?: string;
  amount: string; campaign_title?: string; agent_id?: string; agent_name?: string;
  status: string; notes?: string; admin_notes?: string;
  collected_at?: string; created_at: string;
}
interface Agent { id: string; name: string; phone: string; zone?: string; is_active: boolean; }

export default function AdminFieldOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<FieldOrder[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<FieldOrder | null>(null);
  const [assignAgentId, setAssignAgentId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [o, a] = await Promise.all([
        api.get<FieldOrder[]>("/field-orders"),
        api.get<Agent[]>("/agents"),
      ]);
      setOrders(o); setAgents(a.filter(a => a.is_active));
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (filterType !== "all" && o.order_type !== filterType) return false;
    if (search && !o.donor_name.includes(search) && !o.donor_phone.includes(search)) return false;
    return true;
  });

  async function openOrder(o: FieldOrder) {
    setSelectedOrder(o);
    setAssignAgentId(o.agent_id || "");
    setAdminNotes(o.admin_notes || "");
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(true);
    try {
      const body: any = { status, admin_notes: adminNotes };
      if (assignAgentId) body.agent_id = assignAgentId;
      await api.patch(`/field-orders/${id}`, body);
      toast({ title: `تم تغيير الحالة إلى: ${STATUS_CONFIG[status]?.label}` });
      setSelectedOrder(null); load();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setUpdating(false); }
  }

  async function saveAssignment(id: string) {
    setUpdating(true);
    try {
      await api.patch(`/field-orders/${id}`, { agent_id: assignAgentId || null, admin_notes: adminNotes });
      toast({ title: "تم حفظ التعيين" });
      setSelectedOrder(null); load();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setUpdating(false); }
  }

  const stats = {
    pending: orders.filter(o => o.status === "pending").length,
    assigned: orders.filter(o => o.status === "assigned").length,
    collected: orders.filter(o => o.status === "collected").length,
    total_collected: orders.filter(o => o.status === "collected").reduce((s, o) => s + Number(o.amount), 0),
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">طلبات التحصيل الميداني</h2>
          <p className="text-muted-foreground text-sm mt-1">دفع منزلي + طلبات المناديب</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="w-4 h-4" />تحديث</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "انتظار", value: stats.pending, color: "text-amber-600", icon: Clock },
          { label: "معيَّن", value: stats.assigned, color: "text-blue-600", icon: Truck },
          { label: "تم التحصيل", value: stats.collected, color: "text-primary", icon: CheckCircle2 },
          { label: "مجموع المحصَّل", value: formatCurrency(stats.total_collected), color: "text-primary", icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="pr-9" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">كل الحالات</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">كل الأنواع</option>
          <option value="home_delivery">دفع منزلي</option>
          <option value="agent">طلب مندوب</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-card rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
          <Home className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد طلبات</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/40">
                <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground">المتبرع</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground hidden md:table-cell">النوع</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground">المبلغ</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground">الحالة</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground hidden lg:table-cell">المندوب</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground hidden lg:table-cell">التاريخ</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground">إجراء</th>
              </tr></thead>
              <tbody>
                {filtered.map(o => {
                  const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold">{o.donor_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{o.donor_phone}</p>
                        {o.address && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{o.address}</p>}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{ORDER_TYPE_LABELS[o.order_type] || o.order_type}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-primary">{formatCurrency(o.amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${sc.color}`}>
                          <sc.icon className="w-3 h-3" />{sc.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                        {o.agent_name || <span className="text-amber-500">غير معيَّن</span>}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openOrder(o)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-muted/30 px-4 py-2 flex justify-between text-sm">
            <span className="text-muted-foreground">{filtered.length} طلب</span>
            <span className="font-bold text-primary">{formatCurrency(filtered.reduce((s, o) => s + Number(o.amount), 0))}</span>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">تفاصيل الطلب</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedOrder(null)}><X className="w-4 h-4" /></Button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-xl p-4">
                {[
                  ["المتبرع", selectedOrder.donor_name],
                  ["الهاتف", selectedOrder.donor_phone],
                  ["المبلغ", formatCurrency(selectedOrder.amount)],
                  ["النوع", ORDER_TYPE_LABELS[selectedOrder.order_type] || selectedOrder.order_type],
                  ["الحملة", selectedOrder.campaign_title || "—"],
                  ["الموعد المفضل", selectedOrder.preferred_time || "—"],
                ].map(([l, v]) => (
                  <div key={String(l)}>
                    <p className="text-xs text-muted-foreground">{l}</p>
                    <p className="font-bold text-sm">{v}</p>
                  </div>
                ))}
                {selectedOrder.address && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">العنوان</p>
                    <p className="font-bold text-sm">{selectedOrder.address}</p>
                  </div>
                )}
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">ملاحظات المتبرع</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Assign Agent */}
              <div className="space-y-2">
                <label className="text-sm font-medium">تعيين مندوب</label>
                <select value={assignAgentId} onChange={e => setAssignAgentId(e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
                  <option value="">-- بدون مندوب --</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name} {a.zone ? `(${a.zone})` : ""}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظات الإدارة</label>
                <Input placeholder="ملاحظات للمندوب..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => saveAssignment(selectedOrder.id)} disabled={updating} variant="outline" className="gap-1">
                  <UserCheck className="w-4 h-4" /> حفظ التعيين
                </Button>
                {selectedOrder.status !== "collected" && (
                  <Button onClick={() => updateStatus(selectedOrder.id, "collected")} disabled={updating} className="gap-1">
                    <CheckCircle2 className="w-4 h-4" /> تم التحصيل
                  </Button>
                )}
                {selectedOrder.status !== "failed" && (
                  <Button onClick={() => updateStatus(selectedOrder.id, "failed")} disabled={updating} variant="destructive" className="gap-1">
                    <XCircle className="w-4 h-4" /> فشل
                  </Button>
                )}
                <a
                  href={`https://wa.me/2${selectedOrder.donor_phone.replace(/^0/, "")}?text=${encodeURIComponent(`السلام عليكم ${selectedOrder.donor_name}، سيتصل بك مندوبنا قريباً لاستلام تبرعكم بمبلغ ${formatCurrency(selectedOrder.amount)} - مؤسسة رفقاء البررة`)}`}
                  target="_blank" rel="noreferrer"
                  className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> تواصل عبر واتساب
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
