import { useState, useEffect, useMemo, useRef } from "react";
import api from "@/lib/api-client";
import { insertAuditLog } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, X, Search, Eye, Clock, CheckCircle2, XCircle, Download, FileSpreadsheet, Hash, Settings2, Pencil, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount);

type DonationStatus = "pending" | "approved" | "rejected";

const statusConfig: Record<DonationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "قيد المراجعة", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: "معتمد", color: "bg-primary/10 text-primary", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "مرفوض", color: "bg-destructive/10 text-destructive", icon: <XCircle className="w-3.5 h-3.5" /> },
};

interface AdminDonationsProps { filterStatus?: DonationStatus; }

export default function AdminDonations({ filterStatus }: AdminDonationsProps) {
  const { toast } = useToast();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [localFilter, setLocalFilter] = useState<DonationStatus | "all">("all");
  const [previewDonation, setPreviewDonation] = useState<any>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [seqStart, setSeqStart] = useState(1);
  const [showSeqSettings, setShowSeqSettings] = useState(false);
  const [seqInput, setSeqInput] = useState("1");
  const [sortBy, setSortBy] = useState<"created_at" | "amount" | "status">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const editRef = useRef<HTMLInputElement>(null);

  const activeFilter = filterStatus || (localFilter === "all" ? undefined : localFilter);

  async function load() {
    try {
      const data = await api.get<any[]>("/donations");
      setDonations(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    // Load sequence start from localStorage
    const saved = localStorage.getItem("donation_seq_start");
    if (saved) { setSeqStart(Number(saved)); setSeqInput(saved); }
  }, []);

  useEffect(() => {
    if (editingCell) setTimeout(() => editRef.current?.focus(), 50);
  }, [editingCell]);

  const sorted = useMemo(() => {
    return [...donations].sort((a, b) => {
      let va = a[sortBy]; let vb = b[sortBy];
      if (sortBy === "amount") { va = Number(va); vb = Number(vb); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [donations, sortBy, sortDir]);

  const filtered = useMemo(() => {
    return sorted
      .filter(d => !activeFilter || d.status === activeFilter)
      .filter(d =>
        (d.donor_name || "").includes(search) ||
        (d.donor_phone || "").includes(search) ||
        (d.campaign_title || "").includes(search) ||
        (d.operation_id || "").includes(search) ||
        (d.refqa_id || "").includes(search)
      );
  }, [sorted, search, activeFilter]);

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  }

  async function handleStatusChange(id: string, status: DonationStatus) {
    try {
      await api.patch(`/donations/${id}`, { status });
      await insertAuditLog({ action: status === "approved" ? "اعتماد تبرع" : "رفض تبرع", table_name: "donations", record_id: id });
      setDonations(prev => prev.map(d => d.id === id ? { ...d, status } : d));
      toast({ title: status === "approved" ? "✅ تم اعتماد التبرع" : "❌ تم رفض التبرع" });
      setPreviewDonation(null);
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  function startEdit(id: string, field: string, value: any) {
    setEditingCell({ id, field });
    setEditValue(String(value ?? ""));
  }

  async function saveEdit() {
    if (!editingCell) return;
    const { id, field } = editingCell;
    try {
      const body: any = { [field]: field === "amount" ? Number(editValue) : editValue };
      await api.patch(`/donations/${id}`, body);
      setDonations(prev => prev.map(d => d.id === id ? { ...d, [field]: field === "amount" ? Number(editValue) : editValue } : d));
      toast({ title: "تم الحفظ" });
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setEditingCell(null); }
  }

  function saveSeqSettings() {
    const n = Math.max(1, Number(seqInput) || 1);
    setSeqStart(n);
    setSeqInput(String(n));
    localStorage.setItem("donation_seq_start", String(n));
    setShowSeqSettings(false);
    toast({ title: "تم حفظ إعدادات التسلسل" });
  }

  async function handleDelete(id: string, donorName: string) {
    if (!confirm(`هل تريد حذف تبرع ${donorName}؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    try {
      await api.delete(`/donations/${id}`);
      setDonations(prev => prev.filter(d => d.id !== id));
      if (previewDonation?.id === id) setPreviewDonation(null);
      await insertAuditLog({ action: "حذف تبرع", table_name: "donations", record_id: id });
      toast({ title: "🗑 تم حذف التبرع" });
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  function exportToExcel() {
    const headers = ["#", "رقم التسلسل", "اسم المتبرع", "الهاتف", "الحملة", "المبلغ", "طريقة الدفع", "الحالة", "رقم العملية", "التاريخ"];
    const rows = filtered.map((d, i) => [
      i + 1, seqStart + sorted.indexOf(d),
      d.donor_name, d.donor_phone, d.campaign_title || "",
      d.amount, d.payment_method || "", d.status, d.operation_id,
      new Date(d.created_at).toLocaleDateString("ar-EG")
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-card rounded-xl" />)}</div>;

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">
            إدارة التبرعات
            {activeFilter && <span className="text-base text-muted-foreground mr-2">({statusConfig[activeFilter]?.label})</span>}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">إجمالي {filtered.length} تبرع</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className="pr-9 w-52" />
          </div>
          {!filterStatus && (
            <select value={localFilter} onChange={e => setLocalFilter(e.target.value as any)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">الكل</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
            </select>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowSeqSettings(true)} className="gap-1.5 h-10">
            <Hash className="w-4 h-4" /> ترقيم
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-1.5 h-10">
            <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(["pending", "approved", "rejected"] as DonationStatus[]).map(s => {
          const count = donations.filter(d => d.status === s).length;
          const total = donations.filter(d => d.status === s).reduce((sum, d) => sum + Number(d.amount), 0);
          const st = statusConfig[s];
          return (
            <div key={s} className={`bg-card rounded-xl p-3 border border-border text-center cursor-pointer transition-all hover:shadow-md ${localFilter === s ? "ring-2 ring-primary" : ""}`}
              onClick={() => !filterStatus && setLocalFilter(localFilter === s ? "all" : s)}>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${st.color} mb-1`}>
                {st.icon}{st.label}
              </div>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(total)}</p>
            </div>
          );
        })}
      </div>

      {/* Sequence settings modal */}
      <Dialog open={showSeqSettings} onOpenChange={setShowSeqSettings}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><Hash className="w-5 h-5" /> إعدادات الترقيم التسلسلي</DialogTitle>
            <DialogDescription>حدد رقم البداية لتسلسل التبرعات في الجدول</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">رقم البداية</label>
              <Input type="number" min="1" value={seqInput} onChange={e => setSeqInput(e.target.value)} dir="ltr" />
              <p className="text-xs text-muted-foreground mt-1">مثال: أدخل 100 ليبدأ العد من 100</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSeqSettings(false)}>إلغاء</Button>
              <Button onClick={saveSeqSettings}>حفظ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
          <p>لا توجد تبرعات في هذه الفئة</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-right py-3 px-3 font-bold text-xs text-muted-foreground w-12">#</th>
                  <th className="text-right py-3 px-3 font-bold text-xs text-muted-foreground hidden xl:table-cell">رقم Refqa</th>
                  <th className="text-right py-3 px-3 font-bold text-xs text-muted-foreground">المتبرع</th>
                  <th className="text-right py-3 px-3 font-bold text-xs text-muted-foreground hidden md:table-cell">الحملة</th>
                  <th className="text-right py-3 px-3 font-bold text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("amount")}>
                    المبلغ {sortBy === "amount" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="text-right py-3 px-3 font-bold text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("status")}>
                    الحالة {sortBy === "status" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="text-right py-3 px-3 font-bold text-xs text-muted-foreground hidden lg:table-cell cursor-pointer hover:text-foreground" onClick={() => toggleSort("created_at")}>
                    التاريخ {sortBy === "created_at" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="text-right py-3 px-3 font-bold text-xs text-muted-foreground">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, idx) => {
                  const st = statusConfig[(d.status as DonationStatus) || "pending"];
                  const seqNum = seqStart + sorted.indexOf(d);
                  return (
                    <tr key={d.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                      {/* Seq # */}
                      <td className="py-2.5 px-3">
                        <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {seqNum}
                        </span>
                      </td>
                      {/* Refqa ID */}
                      <td className="py-2.5 px-3 hidden xl:table-cell">
                        {d.refqa_id ? (
                          <span className="text-xs font-mono font-bold text-primary bg-primary/8 px-2 py-0.5 rounded-full border border-primary/20">
                            {d.refqa_id}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>
                      {/* Donor */}
                      <td className="py-2.5 px-3">
                        {editingCell?.id === d.id && editingCell?.field === "donor_name" ? (
                          <div className="flex gap-1">
                            <Input ref={editRef} value={editValue} onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingCell(null); }}
                              className="h-7 text-xs w-36" />
                            <button onClick={saveEdit} className="text-green-500"><Save className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingCell(null)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="group/cell">
                            <p className="font-bold text-sm flex items-center gap-1">
                              {d.donor_name}
                              <button onClick={() => startEdit(d.id, "donor_name", d.donor_name)} className="opacity-0 group-hover/cell:opacity-100 text-muted-foreground">
                                <Pencil className="w-3 h-3" />
                              </button>
                            </p>
                            <p className="text-xs text-muted-foreground">{d.donor_phone}</p>
                          </div>
                        )}
                      </td>
                      {/* Campaign */}
                      <td className="py-2.5 px-3 text-xs text-muted-foreground hidden md:table-cell max-w-[140px] truncate">
                        {d.campaign_title || "—"}
                      </td>
                      {/* Amount */}
                      <td className="py-2.5 px-3">
                        {editingCell?.id === d.id && editingCell?.field === "amount" ? (
                          <div className="flex gap-1">
                            <Input ref={editRef} type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingCell(null); }}
                              className="h-7 text-xs w-24" dir="ltr" />
                            <button onClick={saveEdit} className="text-green-500"><Save className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingCell(null)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <span className="font-bold text-primary flex items-center gap-1 group/cell cursor-pointer"
                            onClick={() => startEdit(d.id, "amount", d.amount)}>
                            {formatCurrency(Number(d.amount))}
                            <Pencil className="w-3 h-3 opacity-0 group-hover/cell:opacity-60" />
                          </span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${st.color}`}>
                          {st.icon}{st.label}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="py-2.5 px-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {new Date(d.created_at).toLocaleDateString("ar-EG")}
                      </td>
                      {/* Actions */}
                      <td className="py-2.5 px-3">
                        <div className="flex gap-0.5">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewDonation(d)} className="h-7 w-7 p-0" title="عرض">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {d.status === "pending" && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleStatusChange(d.id, "approved")} className="h-7 w-7 p-0 text-primary" title="اعتماد">
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleStatusChange(d.id, "rejected")} className="h-7 w-7 p-0 text-destructive" title="رفض">
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id, d.donor_name)} className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity" title="حذف">
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
          {/* Summary row */}
          <div className="border-t border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">إجمالي المعروض: <strong>{filtered.length}</strong> تبرع</span>
            <span className="font-bold text-primary">
              {formatCurrency(filtered.reduce((s, d) => s + Number(d.amount), 0))}
            </span>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewDonation} onOpenChange={() => setPreviewDonation(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-display">تفاصيل التبرع</DialogTitle>
            <DialogDescription>مراجعة بيانات التبرع وإيصال الدفع</DialogDescription>
          </DialogHeader>
          {previewDonation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["المتبرع", previewDonation.donor_name],
                  ["الهاتف", previewDonation.donor_phone],
                  ["الحملة", previewDonation.campaign_title || "—"],
                  ["المبلغ", formatCurrency(Number(previewDonation.amount))],
                  ["طريقة الدفع", previewDonation.payment_method],
                  ["رقم التسلسل", seqStart + sorted.indexOf(previewDonation)],
                ].map(([label, val]) => (
                  <div key={String(label)}>
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="font-bold">{val}</p>
                  </div>
                ))}
                {previewDonation.refqa_id && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">رقم Refqa</p>
                    <p className="font-bold font-mono text-sm text-primary" dir="ltr">{previewDonation.refqa_id}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">رقم العملية</p>
                  <p className="font-bold font-mono text-xs" dir="ltr">{previewDonation.operation_id}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">التاريخ</p>
                  <p className="font-bold">{new Date(previewDonation.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
              {previewDonation.receipt_image_url && (
                <div>
                  <p className="text-sm font-bold mb-2">إيصال الدفع:</p>
                  <img src={previewDonation.receipt_image_url} alt="إيصال" className="rounded-xl border border-border max-h-64 w-full object-contain" />
                  <a href={previewDonation.receipt_image_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                    <Download className="w-3 h-3" /> تحميل الإيصال
                  </a>
                </div>
              )}
              {previewDonation.status === "pending" && (
                <div className="flex gap-2">
                  <Button onClick={() => handleStatusChange(previewDonation.id, "approved")} className="flex-1 gap-1">
                    <Check className="w-4 h-4" /> اعتماد
                  </Button>
                  <Button variant="destructive" onClick={() => handleStatusChange(previewDonation.id, "rejected")} className="flex-1 gap-1">
                    <X className="w-4 h-4" /> رفض
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
