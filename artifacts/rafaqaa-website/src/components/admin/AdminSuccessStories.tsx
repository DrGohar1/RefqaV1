import { useState, useEffect } from "react";
import { fetchSettings, updateSettings } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, BookOpen, ImageIcon } from "lucide-react";

interface Story {
  title: string;
  desc: string;
  image: string;
  amount: string;
}

const AdminSuccessStories = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    fetchSettings("success_stories")
      .then((data) => { if (data && Array.isArray(data)) setStories(data as unknown as Story[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addStory = () => setStories([...stories, { title: "", desc: "", image: "", amount: "" }]);
  const removeStory = (i: number) => setStories(stories.filter((_, idx) => idx !== i));
  const updateStory = (i: number, field: keyof Story, value: string) =>
    setStories(stories.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings("success_stories", stories);
      toast({ title: "✅ تم حفظ قصص النجاح" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">{[1, 2].map((i) => <div key={i} className="h-32 bg-card rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" /> قصص النجاح
        </h2>
        <Button size="sm" variant="outline" onClick={addStory} className="gap-1">
          <Plus className="w-4 h-4" /> إضافة قصة
        </Button>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-4">
        <p className="text-sm text-muted-foreground">هذه القصص تظهر في قسم "قصص نجاح حقيقية" على الصفحة الرئيسية</p>

        <div className="space-y-4">
          {stories.map((s, i) => (
            <div key={i} className="bg-muted rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground">قصة #{i + 1}</span>
                <button onClick={() => removeStory(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Input value={s.title} onChange={(e) => updateStory(i, "title", e.target.value)} placeholder="عنوان القصة" />
              <Input value={s.desc} onChange={(e) => updateStory(i, "desc", e.target.value)} placeholder="وصف مختصر" />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1"><ImageIcon className="w-3 h-3" /> رابط الصورة</label>
                  <Input value={s.image} onChange={(e) => updateStory(i, "image", e.target.value)} placeholder="https://..." dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">المبلغ المُنجَز</label>
                  <Input value={s.amount} onChange={(e) => updateStory(i, "amount", e.target.value)} placeholder="١٥٠,٠٠٠ ج.م" />
                </div>
              </div>
              {s.image && (
                <img src={s.image} alt={s.title} className="h-24 w-full object-cover rounded-lg" />
              )}
            </div>
          ))}
          {stories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">لا توجد قصص بعد — اضغط "إضافة قصة" للبدء</div>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ القصص"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSuccessStories;
