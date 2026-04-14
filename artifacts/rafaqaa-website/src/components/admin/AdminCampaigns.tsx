import { useState, useEffect, useRef, useMemo } from "react";
import { fetchCampaigns, insertCampaign, updateCampaign, deleteCampaign } from "@/lib/supabase-helpers";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Save, X, Search, BarChart3, ArrowUpDown, ArrowUp, ArrowDown, ImageIcon } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount);

type SortField = "title" | "goal_amount" | "raised_amount" | "days_left" | "status";
type SortDir = "asc" | "desc";

interface InlineCell { id: string; field: string; }

const STATUS_OPTIONS = [
  { value: "active", label: "نشطة", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  { value: "completed", label: "مكتملة", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "paused", label: "متوقفة", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
];

function statusCls(s: string) { return STATUS_OPTIONS.find(o => o.value === s)?.cls || STATUS_OPTIONS[0].cls; }
function statusLabel(s: string) { return STATUS_OPTIONS.find(o => o.value === s)?.label || s; }

const AdminCampaigns = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", goal_amount: "", image_url: "", category: "", days_left: "30", status: "active" });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [inlineCell, setInlineCell] = useState<InlineCell | null>(null);
  const [inlineVal, setInlineVal] = useState("");
  const [saving, setSaving] = useState(false);
  const inlineRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const loadCampaigns = async () => {
    setLoading(true);
    try { setCampaigns(await fetchCampaigns() || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCampaigns(); }, []);

  useEffect(() => {
    if (inlineCell) setTimeout(() => (inlineRef.current as HTMLElement)?.focus(), 50);
  }, [inlineCell]);

  const sorted = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      let va = a[sortBy]; let vb = b[sortBy];
      if (["goal_amount", "raised_amount", "days_left"].includes(sortBy)) { va = Number(va); vb = Number(vb); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [campaigns, sortBy, sortDir]);

  const filtered = useMemo(() =>
    sorted.filter(c =>
      c.title?.includes(search) || c.category?.includes(search) || c.description?.includes(search)
    ), [sorted, search]);

  function toggleSort(field: SortField) {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
  }

  function startInline(id: string, field: string, value: any) {
    setInlineCell({ id, field });
    setInlineVal(String(value ?? ""));
  }

  async function saveInline() {
    if (!inlineCell) return;
    const { id, field } = inlineCell;
    setSaving(true);
    try {
      const val: any = ["goal_amount", "raised_amount", "days_left"].includes(field) ? Number(inlineVal) : inlineVal;
      await updateCampaign(id, { [field]: val });
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
      toast({ title: "✅ تم الحفظ" });
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setInlineCell(null); setSaving(false); }
  }

  function cancelInline() { setInlineCell(null); }

  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({ title: c.title, description: c.description || "", goal_amount: String(c.goal_amount), image_url: c.image_url || "", category: c.category || "", days_left: String(c.days_left || 30), status: c.status || "active" });
    setShowForm(true);
  };

  const resetForm = () => { setForm({ title: "", description: "", goal_amount: "", image_url: "", category: "", days_left: "30", status: "active" }); setEditing(null); setShowForm(false); };

  const handleSave = async () => {
    if (!form.title || !form.goal_amount) { toast({ title: "خطأ", description: "العنوان والمبلغ مطلوبان", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { title: form.title, description: form.description, goal_amount: Number(form.goal_amount), image_url: form.image_url, category: form.category, days_left: Number(form.days_left), status: form.status };
      if (editing) { await updateCampaign(editing.id, payload); toast({ title: "تم التحديث" }); }
      else { await insertCampaign(payload as any); toast({ title: "تمت الإضافة" }); }
      resetForm(); loadCampaigns();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحملة؟")) return;
    try { await deleteCampaign(id); setCampaigns(prev => prev.filter(c => c.id !== id)); toast({ title: "تم الحذف" }); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  };

  const InlineInput = ({ id, field, type = "text" }: { id: string; field: string; type?: string }) =>
    inlineCell?.id === id && inlineCell?.field === field ? (
      <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
        <Input
          ref={inlineRef as any}
          type={type}
          value={inlineVal}
          onChange={e => setInlineVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") saveInline(); if (e.key === "Escape") cancelInline(); }}
          className="h-7 text-xs w-28"
          dir={type === "number" ? "ltr" : "rtl"}
        />
        <button onClick={saveInline} className="text-green-500 hover:text-green-600" disabled={saving}><Save className="w-3.5 h-3.5" /></button>
        <button onClick={cancelInline} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
    ) : null;

  const InlineStatus = ({ id, field, value }: { id: string; field: string; value: string }) =>
    inlineCell?.id === id && inlineCell?.field === field ? (
      <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
        <select
          ref={inlineRef as any}
          value={inlineVal}
          onChange={e => setInlineVal(e.target.value)}
          onBlur={saveInline}
          className="h-7 text-xs rounded border border-input bg-background px-2"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={cancelInline} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
    ) : (
      <button
        onClick={() => startInline(id, field, value)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold cursor-pointer hover:opacity-80 ${statusCls(value)}`}
      >
        {statusLabel(value)}
        <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/row:opacity-60" />
      </button>
    );

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">إدارة الحملات</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} حملة • انقر على أي خلية للتعديل المباشر</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="pr-9 w-44 h-9" />
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 h-9">
            <Plus className="w-4 h-4" /> حملة جديدة
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي الحملات", val: campaigns.length, color: "text-primary" },
          { label: "إجمالي المستهدف", val: formatCurrency(campaigns.reduce((s, c) => s + Number(c.goal_amount), 0)), color: "text-amber-600" },
          { label: "إجمالي المحصّل", val: formatCurrency(campaigns.reduce((s, c) => s + Number(c.raised_amount), 0)), color: "text-green-600" },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-3 text-center">
            <p className={`text-lg font-bold ${color}`}>{val}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-card rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد حملات</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <th className="text-right py-3 px-3 font-bold w-8">#</th>
                  <th className="text-right py-3 px-3 font-bold cursor-pointer hover:text-foreground" onClick={() => toggleSort("title")}>
                    <div className="flex items-center gap-1">الحملة <SortIcon field="title" /></div>
                  </th>
                  <th className="text-right py-3 px-3 font-bold cursor-pointer hover:text-foreground hidden md:table-cell" onClick={() => toggleSort("goal_amount")}>
                    <div className="flex items-center gap-1">المستهدف <SortIcon field="goal_amount" /></div>
                  </th>
                  <th className="text-right py-3 px-3 font-bold cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => toggleSort("raised_amount")}>
                    <div className="flex items-center gap-1">المحصّل <SortIcon field="raised_amount" /></div>
                  </th>
                  <th className="text-right py-3 px-3 font-bold hidden xl:table-cell">التقدم</th>
                  <th className="text-right py-3 px-3 font-bold cursor-pointer hover:text-foreground" onClick={() => toggleSort("status")}>
                    <div className="flex items-center gap-1">الحالة <SortIcon field="status" /></div>
                  </th>
                  <th className="text-right py-3 px-3 font-bold cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => toggleSort("days_left")}>
                    <div className="flex items-center gap-1">الأيام <SortIcon field="days_left" /></div>
                  </th>
                  <th className="text-right py-3 px-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const progress = Math.min(100, Math.round((Number(c.raised_amount) / Number(c.goal_amount)) * 100));
                  const isEditing = inlineCell?.id === c.id;
                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group/row">
                      <td className="py-2.5 px-3 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                      {/* Title */}
                      <td className="py-2.5 px-3">
                        {inlineCell?.id === c.id && inlineCell?.field === "title" ? (
                          <InlineInput id={c.id} field="title" />
                        ) : (
                          <div className="group/cell flex items-center gap-2">
                            {c.image_url ? (
                              <img src={c.image_url} alt={c.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <button onClick={() => startInline(c.id, "title", c.title)}
                                className="font-bold text-sm text-right hover:text-primary transition-colors flex items-center gap-1">
                                {c.title}
                                <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/cell:opacity-50" />
                              </button>
                              <p className="text-xs text-muted-foreground">{c.category || "—"}</p>
                            </div>
                          </div>
                        )}
                      </td>
                      {/* Goal */}
                      <td className="py-2.5 px-3 hidden md:table-cell">
                        {inlineCell?.id === c.id && inlineCell?.field === "goal_amount" ? (
                          <InlineInput id={c.id} field="goal_amount" type="number" />
                        ) : (
                          <button onClick={() => startInline(c.id, "goal_amount", c.goal_amount)}
                            className="text-sm font-semibold text-amber-600 dark:text-amber-400 hover:opacity-80 group/cell flex items-center gap-1">
                            {formatCurrency(Number(c.goal_amount))}
                            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/cell:opacity-50" />
                          </button>
                        )}
                      </td>
                      {/* Raised */}
                      <td className="py-2.5 px-3 hidden lg:table-cell">
                        {inlineCell?.id === c.id && inlineCell?.field === "raised_amount" ? (
                          <InlineInput id={c.id} field="raised_amount" type="number" />
                        ) : (
                          <button onClick={() => startInline(c.id, "raised_amount", c.raised_amount)}
                            className="text-sm font-semibold text-green-600 dark:text-green-400 hover:opacity-80 group/cell flex items-center gap-1">
                            {formatCurrency(Number(c.raised_amount))}
                            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/cell:opacity-50" />
                          </button>
                        )}
                      </td>
                      {/* Progress */}
                      <td className="py-2.5 px-3 hidden xl:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground">{progress}%</span>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <InlineStatus id={c.id} field="status" value={c.status || "active"} />
                      </td>
                      {/* Days */}
                      <td className="py-2.5 px-3 hidden lg:table-cell">
                        {inlineCell?.id === c.id && inlineCell?.field === "days_left" ? (
                          <InlineInput id={c.id} field="days_left" type="number" />
                        ) : (
                          <button onClick={() => startInline(c.id, "days_left", c.days_left)}
                            className="text-xs text-muted-foreground hover:text-foreground group/cell flex items-center gap-1">
                            {c.days_left} يوم
                            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/cell:opacity-50" />
                          </button>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="py-2.5 px-3">
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(c)} title="تعديل كامل">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)} title="حذف">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className="border-t border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>إجمالي المعروض: <strong>{filtered.length}</strong> حملة</span>
            <span className="font-bold text-primary">
              {formatCurrency(filtered.reduce((s, c) => s + Number(c.raised_amount), 0))} محصّل
            </span>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => resetForm()}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "تعديل الحملة" : "إضافة حملة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium mb-1 block">العنوان *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="عنوان الحملة" /></div>
            <div><label className="text-sm font-medium mb-1 block">الوصف</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف مختصر" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">المبلغ المستهدف *</label>
                <Input type="number" value={form.goal_amount} onChange={e => setForm(f => ({ ...f, goal_amount: e.target.value }))} placeholder="0" dir="ltr" /></div>
              <div><label className="text-sm font-medium mb-1 block">الأيام المتبقية</label>
                <Input type="number" value={form.days_left} onChange={e => setForm(f => ({ ...f, days_left: e.target.value }))} placeholder="30" dir="ltr" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">التصنيف</label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="مثال: رمضان" /></div>
              <div><label className="text-sm font-medium mb-1 block">الحالة</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background">
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">رابط الصورة</label>
              <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." dir="ltr" /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : editing ? "تحديث الحملة" : "إضافة الحملة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCampaigns;
