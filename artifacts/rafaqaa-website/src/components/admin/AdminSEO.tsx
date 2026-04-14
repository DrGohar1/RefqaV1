import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Save, Globe, Image, Share2, Code, Eye, Loader2, RefreshCw } from "lucide-react";

const CHAR_LIMITS = { site_title: 60, meta_description: 160, keywords: 300 };

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const pct = len / max;
  const color = pct > 1 ? "text-red-500" : pct > 0.85 ? "text-amber-500" : "text-green-600";
  return <span className={`text-xs font-mono ${color}`}>{len}/{max}</span>;
}

export default function AdminSEO() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewTab, setPreviewTab] = useState<"google" | "facebook" | "twitter">("google");
  const [form, setForm] = useState({
    site_title: "رفقاء البررة | منصة التبرع الخيري الإلكترونية — مصر",
    meta_description: "رفقاء البررة مؤسسة خيرية مرخصة برقم 7932 من وزارة التضامن الاجتماعي. تبرّع وساهم في حملات إغاثة الأسر الفقيرة وكفالة الأيتام. نظام دفع آمن | إيصال فوري | شفافية كاملة.",
    keywords: "تبرع, خير, رفقاء البررة, صدقة, حملات خيرية, مصر, كفالة أيتام, إغاثة, وقف, صدقة جارية",
    og_image: "",
    og_url: "https://rafaqaa.org",
    twitter_handle: "@rafaqaa",
    google_analytics: "",
    facebook_pixel: "",
    schema_type: "NGO",
    schema_phone: "+20-113-092-5036",
    schema_email: "info@rafaqaa.org",
    schema_founded: "2020",
    robots: "index, follow",
    canonical: "https://rafaqaa.org/",
    favicon_url: "",
  });

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<any>("/settings/seo");
      if (res?.value) setForm(f => ({ ...f, ...res.value }));
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    try {
      await api.put("/settings/seo", { value: form });
      toast({ title: "✅ تم حفظ إعدادات SEO" });
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  }

  const f = (field: keyof typeof form) => (e: any) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" /> SEO وتحسين محركات البحث
          </h2>
          <p className="text-sm text-muted-foreground mt-1">تحسين ظهور موقعك في Google وشبكات التواصل</p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          {/* Basic SEO */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-sm"><Globe className="w-4 h-4 text-primary" /> الأساسيات</h3>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">عنوان الصفحة (Title Tag) *</label>
                <CharCount value={form.site_title} max={CHAR_LIMITS.site_title} />
              </div>
              <Input value={form.site_title} onChange={f("site_title")} placeholder="رفقاء البررة | منصة التبرع..." />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">الوصف (Meta Description) *</label>
                <CharCount value={form.meta_description} max={CHAR_LIMITS.meta_description} />
              </div>
              <textarea value={form.meta_description} onChange={f("meta_description")} rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="وصف مختصر يظهر في نتائج Google..." />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">الكلمات المفتاحية</label>
                <CharCount value={form.keywords} max={CHAR_LIMITS.keywords} />
              </div>
              <Input value={form.keywords} onChange={f("keywords")} placeholder="تبرع, خير, رفقاء البررة..." />
              <p className="text-xs text-muted-foreground mt-1">افصل بين الكلمات بفاصلة</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Canonical URL</label>
                <Input value={form.canonical} onChange={f("canonical")} placeholder="https://rafaqaa.org/" dir="ltr" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Robots</label>
                <select value={form.robots} onChange={f("robots") as any}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="index, follow">index, follow (افتراضي)</option>
                  <option value="noindex, follow">noindex, follow</option>
                  <option value="index, nofollow">index, nofollow</option>
                  <option value="noindex, nofollow">noindex, nofollow</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">رابط Favicon</label>
              <Input value={form.favicon_url} onChange={f("favicon_url")} placeholder="/favicon.svg" dir="ltr" />
            </div>
          </div>

          {/* Open Graph */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-sm"><Share2 className="w-4 h-4 text-blue-500" /> Open Graph (مشاركة على السوشيال)</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">رابط صورة المشاركة (OG Image)</label>
              <Input value={form.og_image} onChange={f("og_image")} placeholder="https://rafaqaa.org/og-image.jpg" dir="ltr" />
              <p className="text-xs text-muted-foreground mt-1">الأبعاد المثلى: 1200×630 بكسل</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">رابط الموقع (OG URL)</label>
              <Input value={form.og_url} onChange={f("og_url")} placeholder="https://rafaqaa.org" dir="ltr" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Twitter Handle</label>
              <Input value={form.twitter_handle} onChange={f("twitter_handle")} placeholder="@rafaqaa" dir="ltr" />
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-sm"><Code className="w-4 h-4 text-orange-500" /> التتبع والتحليلات</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">Google Analytics ID</label>
              <Input value={form.google_analytics} onChange={f("google_analytics")} placeholder="G-XXXXXXXXXX" dir="ltr" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Facebook Pixel ID</label>
              <Input value={form.facebook_pixel} onChange={f("facebook_pixel")} placeholder="123456789" dir="ltr" />
            </div>
          </div>

          {/* Schema.org */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-sm"><Image className="w-4 h-4 text-green-500" /> بيانات المنظّمة (Schema.org)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">نوع المنظّمة</label>
                <select value={form.schema_type} onChange={f("schema_type") as any}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="NGO">NGO (منظمة غير حكومية)</option>
                  <option value="Organization">Organization</option>
                  <option value="NonProfit">NonProfit</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">سنة التأسيس</label>
                <Input value={form.schema_founded} onChange={f("schema_founded")} placeholder="2020" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">هاتف التواصل</label>
                <Input value={form.schema_phone} onChange={f("schema_phone")} placeholder="+20-113-092-5036" dir="ltr" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
                <Input value={form.schema_email} onChange={f("schema_email")} placeholder="info@rafaqaa.org" dir="ltr" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-sm"><Eye className="w-4 h-4 text-primary" /> معاينة مباشرة</h3>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {(["google", "facebook", "twitter"] as const).map(t => (
                  <button key={t} onClick={() => setPreviewTab(t)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${previewTab === t ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                    {t === "google" ? "🔍 Google" : t === "facebook" ? "👍 Facebook" : "🐦 Twitter"}
                  </button>
                ))}
              </div>
            </div>

            {previewTab === "google" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">كيف يظهر في Google</p>
                <div className="border border-border rounded-xl p-4 bg-white dark:bg-gray-900 font-sans">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">ر</div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">rafaqaa.org</p>
                    </div>
                  </div>
                  <p className="text-blue-600 dark:text-blue-400 text-lg font-medium leading-tight line-clamp-1">{form.site_title || "عنوان الصفحة"}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{form.meta_description || "وصف الصفحة..."}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">طول العنوان</span>
                    <span className={form.site_title.length > 60 ? "text-red-500" : "text-green-600"}>{form.site_title.length} / 60 حرف</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">طول الوصف</span>
                    <span className={form.meta_description.length > 160 ? "text-red-500" : "text-green-600"}>{form.meta_description.length} / 160 حرف</span>
                  </div>
                </div>
              </motion.div>
            )}

            {previewTab === "facebook" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-border rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                {form.og_image ? (
                  <img src={form.og_image} alt="OG" className="w-full h-40 object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <Image className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                <div className="p-3 border-t border-border">
                  <p className="text-xs text-gray-500 uppercase">rafaqaa.org</p>
                  <p className="font-bold text-sm mt-0.5 line-clamp-1">{form.site_title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{form.meta_description}</p>
                </div>
              </motion.div>
            )}

            {previewTab === "twitter" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-border rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                {form.og_image ? (
                  <img src={form.og_image} alt="Twitter" className="w-full h-36 object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                ) : (
                  <div className="w-full h-36 bg-muted flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="p-3">
                  <p className="font-bold text-sm line-clamp-1">{form.site_title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{form.meta_description}</p>
                  <p className="text-xs text-blue-400 mt-1">rafaqaa.org</p>
                </div>
              </motion.div>
            )}

            {/* SEO Score */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold">تقييم SEO</p>
              {[
                { label: "عنوان الصفحة", ok: form.site_title.length >= 10 && form.site_title.length <= 60 },
                { label: "الوصف المناسب", ok: form.meta_description.length >= 50 && form.meta_description.length <= 160 },
                { label: "كلمات مفتاحية", ok: form.keywords.length > 5 },
                { label: "صورة المشاركة", ok: !!form.og_image },
                { label: "رابط الموقع", ok: !!form.og_url },
                { label: "Google Analytics", ok: !!form.google_analytics },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={ok ? "text-green-600 font-bold" : "text-muted-foreground/50"}>
                    {ok ? "✅" : "○"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
