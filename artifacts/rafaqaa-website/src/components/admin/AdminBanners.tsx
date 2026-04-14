import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, ImageIcon, Eye, EyeOff, GripVertical, Megaphone } from "lucide-react";

const BG_COLORS = [
  { value: "primary", label: "أخضر (الأساسي)", cls: "bg-primary" },
  { value: "navy", label: "كحلي", cls: "bg-navy-900" },
  { value: "gold", label: "ذهبي", cls: "bg-amber-500" },
  { value: "teal", label: "زيتي", cls: "bg-teal-600" },
  { value: "red", label: "أحمر", cls: "bg-red-500" },
  { value: "purple", label: "بنفسجي", cls: "bg-purple-600" },
];

interface Banner {
  id: string; title: string; subtitle?: string; badge_text?: string;
  image_url?: string; link_url?: string; link_text?: string;
  bg_color: string; display_order: number; is_active: boolean; created_at: string;
}

const emptyForm = {
  title: "", subtitle: "", badge_text: "", image_url: "",
  link_url: "", link_text: "تبرع الآن", bg_color: "primary", display_order: 0,
};

export default function AdminBanners() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setBanners(await api.get<Banner[]>("/banners")); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditBanner(null);
    setForm({ ...emptyForm, display_order: banners.length });
    setShowForm(true);
  }

  function openEdit(b: Banner) {
    setEditBanner(b);
    setForm({ title: b.title, subtitle: b.subtitle || "", badge_text: b.badge_text || "",
      image_url: b.image_url || "", link_url: b.link_url || "", link_text: b.link_text || "تبرع الآن",
      bg_color: b.bg_color, display_order: b.display_order });
    setShowForm(true);
  }

  async function save() {
    if (!form.title) { toast({ title: "العنوان مطلوب", variant: "destructive" }); return; }
    setSaving(true);
    try {
      if (editBanner) { await api.patch(`/banners/${editBanner.id}`, form); toast({ title: "تم التحديث" }); }
      else { await api.post("/banners", form); toast({ title: "تم إنشاء البانر" }); }
      setShowForm(false); load();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function toggleActive(b: Banner) {
    try { await api.patch(`/banners/${b.id}`, { is_active: !b.is_active }); load(); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  async function deleteBanner(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا البانر؟")) return;
    try { await api.delete(`/banners/${id}`); toast({ title: "تم الحذف" }); load(); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">إدارة البانرات</h2>
          <p className="text-muted-foreground text-sm mt-1">بانرات ترويجية تظهر على الصفحة الرئيسية</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />إضافة بانر</Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-xl" />)}</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border border-dashed">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">لا توجد بانرات بعد</p>
          <p className="text-sm mt-1">اضغط "إضافة بانر" لإنشاء أول بانر</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border overflow-hidden flex ${b.is_active ? "border-border" : "border-dashed border-border/50 opacity-60"}`}>
              {/* Color strip */}
              <div className={`w-1.5 flex-shrink-0 ${BG_COLORS.find(c => c.value === b.bg_color)?.cls || "bg-primary"}`} />
              <div className="flex-1 p-4 flex items-center gap-4">
                {b.image_url && (
                  <img src={b.image_url} alt={b.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {b.badge_text && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{b.badge_text}</span>}
                    <h3 className="font-bold truncate">{b.title}</h3>
                    {!b.is_active && <span className="text-xs text-muted-foreground">(مخفي)</span>}
                  </div>
                  {b.subtitle && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{b.subtitle}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>الترتيب: {b.display_order}</span>
                    {b.link_url && <span>رابط: {b.link_url}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleActive(b)} title={b.is_active ? "إخفاء" : "إظهار"}>
                    {b.is_active ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(b)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteBanner(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{editBanner ? "تعديل البانر" : "إضافة بانر جديد"}</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
              </div>

              <div className="space-y-3">
                <div><label className="text-sm font-medium mb-1 block">العنوان الرئيسي *</label>
                  <Input placeholder="مثال: تبرع في رمضان وضاعف أجرك" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><label className="text-sm font-medium mb-1 block">النص الفرعي</label>
                  <Input placeholder="وصف مختصر للبانر" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
                <div><label className="text-sm font-medium mb-1 block">شارة / Badge</label>
                  <Input placeholder="مثال: عرض محدود" value={form.badge_text} onChange={e => setForm(f => ({ ...f, badge_text: e.target.value }))} /></div>
                <div><label className="text-sm font-medium mb-1 block">رابط الصورة</label>
                  <Input placeholder="https://..." dir="ltr" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1 block">رابط الزر</label>
                    <Input placeholder="/#campaigns" dir="ltr" value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} /></div>
                  <div><label className="text-sm font-medium mb-1 block">نص الزر</label>
                    <Input placeholder="تبرع الآن" value={form.link_text} onChange={e => setForm(f => ({ ...f, link_text: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1 block">ترتيب العرض</label>
                    <Input type="number" min="0" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} dir="ltr" /></div>
                  <div><label className="text-sm font-medium mb-1.5 block">لون الخلفية</label>
                    <div className="flex gap-2 flex-wrap">
                      {BG_COLORS.map(c => (
                        <button key={c.value} onClick={() => setForm(f => ({ ...f, bg_color: c.value }))}
                          className={`w-7 h-7 rounded-full ${c.cls} border-2 transition-transform ${form.bg_color === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                          title={c.label} />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Preview */}
                {form.title && (
                  <div className={`rounded-xl p-4 text-white ${BG_COLORS.find(c => c.value === form.bg_color)?.cls || "bg-primary"}`}>
                    {form.badge_text && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full mb-1 inline-block">{form.badge_text}</span>}
                    <h4 className="font-bold">{form.title}</h4>
                    {form.subtitle && <p className="text-sm opacity-90 mt-0.5">{form.subtitle}</p>}
                    {form.link_text && <button className="mt-2 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">{form.link_text}</button>}
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                <Button onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : editBanner ? "تحديث" : "إنشاء"}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
