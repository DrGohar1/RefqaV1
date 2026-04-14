import { useState, useEffect } from "react";
import { fetchSettings, updateSettings } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, Globe, FileText, Link, MessageSquare, RefreshCw } from "lucide-react";
import api from "@/lib/api-client";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";

const AdminSettings = () => {
  const { toast } = useToast();
  const { refreshFlags } = useFeatureFlags();
  const [loading, setLoading] = useState(true);
  const [activeSec, setActiveSec] = useState("general");

  const [general, setGeneral] = useState({ foundation_name: "", phone: "", whatsapp: "", license_number: "", developer_name: "" });
  const [seo, setSeo] = useState({ site_title: "", meta_description: "", og_image: "", favicon_url: "" });
  const [flags, setFlags] = useState<Record<string, boolean>>({
    site_disabled: false, manual_payments: true, basket_system: true,
    sms_notifications: false, api_payments: false, home_delivery: true,
    agent_donations: true, reports: true, guest_donations: true,
    recurring_donations: false, zakat_calculator: true, donation_ticker: true,
  });
  const [siteDisabledMsg, setSiteDisabledMsg] = useState("الموقع في وضع الصيانة، يرجى المحاولة لاحقاً");
  const [social, setSocial] = useState({
    facebook: "", instagram: "", youtube: "", twitter: "", tiktok: "", linkedin: "",
    whatsapp: "201130925036", phone: "01130925036",
    whatsapp_message: "السلام عليكم، أريد الاستفسار عن التبرع",
    address: "جمهورية مصر العربية", email: "",
    developer_name: "GOHAR DEV", developer_url: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [gen, fl, seoData, socialData] = await Promise.all([
          fetchSettings("general"),
          fetchSettings("feature_flags"),
          fetchSettings("seo").catch(() => null),
          api.get<{ value: any }>("/settings/social_links").catch(() => null),
        ]);
        if (gen) setGeneral(g => ({ ...g, ...(gen as any) }));
        if (fl) {
          const { site_disabled_message, ...bools } = fl as any;
          setFlags(f => ({ ...f, ...bools }));
          if (site_disabled_message) setSiteDisabledMsg(site_disabled_message);
        }
        if (seoData) setSeo(s => ({ ...s, ...(seoData as any) }));
        if ((socialData as any)?.value) setSocial(s => ({ ...s, ...(socialData as any).value }));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSaveGeneral = async () => {
    try { await updateSettings("general", general); toast({ title: "✅ تم حفظ البيانات العامة" }); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  };

  const handleSaveSeo = async () => {
    try { await updateSettings("seo", seo); toast({ title: "✅ تم حفظ إعدادات SEO" }); }
    catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  };

  const handleSaveFlags = async () => {
    try {
      await updateSettings("feature_flags", { ...flags, site_disabled_message: siteDisabledMsg });
      await refreshFlags();
      toast({ title: flags.site_disabled ? "🔴 الموقع أُوقف — Kill Switch مفعّل" : "✅ تم حفظ إعدادات المميزات وتطبيقها فوراً" });
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  };

  const handleSaveSocial = async () => {
    try {
      await api.put("/settings/social_links", { value: social });
      toast({ title: "✅ تم حفظ روابط التواصل" });
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
  };

  const flagLabels: Record<string, { label: string; desc: string }> = {
    manual_payments:    { label: "نظام الدفع اليدوي",          desc: "فودافون كاش، انستاباي، بنكي" },
    api_payments:       { label: "بوابة الدفع الإلكتروني",     desc: "دفع Paymob أونلاين" },
    home_delivery:      { label: "التحصيل المنزلي",            desc: "إرسال مندوب للمتبرع" },
    agent_donations:    { label: "التبرع عن طريق مندوب",       desc: "عرض خيار مندوب ميداني" },
    basket_system:      { label: "سلة التبرعات",               desc: "التبرع لعدة حملات في آن واحد" },
    guest_donations:    { label: "التبرع بدون تسجيل",          desc: "السماح للزوار بالتبرع" },
    donation_ticker:    { label: "شريط التبرعات الأخيرة",      desc: "الشريط المتحرك أسفل الهيدر" },
    zakat_calculator:   { label: "حاسبة الزكاة",               desc: "أداة حساب الزكاة" },
    reports:            { label: "التقارير",                   desc: "قسم التقارير والإحصائيات" },
    recurring_donations:{ label: "التبرعات المتكررة",           desc: "قيد التطوير" },
    sms_notifications:  { label: "إشعارات SMS",               desc: "قيد التطوير" },
  };

  const sections = [
    { id: "general", label: "عام", icon: Globe },
    { id: "social", label: "سوشيال", icon: Link },
    { id: "whatsapp", label: "واتساب", icon: MessageSquare },
    { id: "seo", label: "SEO", icon: FileText },
    { id: "flags", label: "المميزات", icon: Shield },
  ];

  if (loading) return <div className="animate-pulse space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-card rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-2xl">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSec(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSec === s.id ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      {/* ── General ── */}
      {activeSec === "general" && (
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Globe className="w-5 h-5 text-primary" /></div>
            <h3 className="font-display text-lg font-bold">البيانات العامة</h3>
          </div>
          <div className="space-y-3">
            <div><label className="text-sm font-medium mb-1 block">اسم المؤسسة</label>
              <Input value={general.foundation_name} onChange={e => setGeneral({ ...general, foundation_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">رقم الهاتف</label>
                <Input value={general.phone} onChange={e => setGeneral({ ...general, phone: e.target.value })} dir="ltr" /></div>
              <div><label className="text-sm font-medium mb-1 block">رقم واتساب</label>
                <Input value={general.whatsapp} onChange={e => setGeneral({ ...general, whatsapp: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">رقم الإشهار</label>
                <Input value={general.license_number} onChange={e => setGeneral({ ...general, license_number: e.target.value })} dir="ltr" /></div>
              <div><label className="text-sm font-medium mb-1 block">اسم الشركة المطورة</label>
                <Input value={general.developer_name} onChange={e => setGeneral({ ...general, developer_name: e.target.value })} /></div>
            </div>
          </div>
          <Button onClick={handleSaveGeneral} className="gap-2"><Save className="w-4 h-4" /> حفظ</Button>
        </div>
      )}

      {/* ── Social Links ── */}
      {activeSec === "social" && (
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Link className="w-5 h-5 text-primary" /></div>
            <h3 className="font-display text-lg font-bold">روابط التواصل الاجتماعي</h3>
          </div>
          <p className="text-sm text-muted-foreground">تظهر هذه الروابط في شريط الأعلى والتذييل.</p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { key: "facebook", label: "فيسبوك", placeholder: "https://facebook.com/..." },
              { key: "instagram", label: "إنستجرام", placeholder: "https://instagram.com/..." },
              { key: "youtube", label: "يوتيوب", placeholder: "https://youtube.com/..." },
              { key: "twitter", label: "تويتر / X", placeholder: "https://twitter.com/..." },
              { key: "tiktok", label: "تيك توك", placeholder: "https://tiktok.com/..." },
              { key: "linkedin", label: "لينكدإن", placeholder: "https://linkedin.com/..." },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium mb-1 block">{f.label}</label>
                <Input value={(social as any)[f.key]} onChange={e => setSocial({ ...social, [f.key]: e.target.value })} placeholder={f.placeholder} dir="ltr" />
              </div>
            ))}
            <div className="border-t border-border pt-3 mt-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1 block">رقم الهاتف (TopBar)</label>
                  <Input value={social.phone} onChange={e => setSocial({ ...social, phone: e.target.value })} dir="ltr" /></div>
                <div><label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
                  <Input value={social.email} onChange={e => setSocial({ ...social, email: e.target.value })} dir="ltr" type="email" /></div>
              </div>
              <div><label className="text-sm font-medium mb-1 block">العنوان</label>
                <Input value={social.address} onChange={e => setSocial({ ...social, address: e.target.value })} placeholder="جمهورية مصر العربية" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1 block">اسم المطور (Footer)</label>
                  <Input value={social.developer_name} onChange={e => setSocial({ ...social, developer_name: e.target.value })} placeholder="GOHAR DEV" /></div>
                <div><label className="text-sm font-medium mb-1 block">رابط موقع المطور</label>
                  <Input value={social.developer_url} onChange={e => setSocial({ ...social, developer_url: e.target.value })} placeholder="https://..." dir="ltr" /></div>
              </div>
            </div>
          </div>
          <Button onClick={handleSaveSocial} className="gap-2"><Save className="w-4 h-4" /> حفظ الروابط</Button>
        </div>
      )}

      {/* ── WhatsApp Template ── */}
      {activeSec === "whatsapp" && (
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-green-600" /></div>
            <h3 className="font-display text-lg font-bold">إعدادات واتساب</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">رقم واتساب المؤسسة</label>
              <Input value={social.whatsapp} onChange={e => setSocial({ ...social, whatsapp: e.target.value })} placeholder="201130925036" dir="ltr" />
              <p className="text-xs text-muted-foreground mt-1">بدون + وبدون مسافات — مثال: 201130925036</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">رسالة واتساب الافتراضية</label>
              <textarea
                value={social.whatsapp_message}
                onChange={e => setSocial({ ...social, whatsapp_message: e.target.value })}
                rows={3}
                placeholder="السلام عليكم، أريد الاستفسار عن التبرع"
                className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">تظهر هذه الرسالة عند الضغط على زر واتساب في الموقع</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">معاينة الرابط:</p>
              <p className="text-xs font-mono text-green-700 dark:text-green-400 break-all" dir="ltr">
                https://wa.me/{social.whatsapp || "201130925036"}?text={encodeURIComponent(social.whatsapp_message || "")}
              </p>
            </div>
          </div>
          <Button onClick={handleSaveSocial} className="gap-2 bg-green-600 hover:bg-green-700"><Save className="w-4 h-4" /> حفظ إعدادات واتساب</Button>
        </div>
      )}

      {/* ── SEO ── */}
      {activeSec === "seo" && (
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
            <h3 className="font-display text-lg font-bold">إعدادات SEO والمحتوى</h3>
          </div>
          <div className="space-y-3">
            <div><label className="text-sm font-medium mb-1 block">عنوان الموقع</label>
              <Input value={seo.site_title} onChange={e => setSeo({ ...seo, site_title: e.target.value })} placeholder="مؤسسة رفقاء البررة" /></div>
            <div><label className="text-sm font-medium mb-1 block">الوصف التعريفي (Meta)</label>
              <Input value={seo.meta_description} onChange={e => setSeo({ ...seo, meta_description: e.target.value })} placeholder="وصف الموقع لمحركات البحث" /></div>
            <div><label className="text-sm font-medium mb-1 block">صورة OG</label>
              <Input value={seo.og_image} onChange={e => setSeo({ ...seo, og_image: e.target.value })} placeholder="رابط الصورة" dir="ltr" /></div>
            <div><label className="text-sm font-medium mb-1 block">أيقونة الموقع (Favicon)</label>
              <Input value={seo.favicon_url} onChange={e => setSeo({ ...seo, favicon_url: e.target.value })} placeholder="رابط الأيقونة (.ico أو .png)" dir="ltr" /></div>
          </div>
          <Button onClick={handleSaveSeo} className="gap-2"><Save className="w-4 h-4" /> حفظ SEO</Button>
        </div>
      )}

      {/* ── Feature Flags ── */}
      {activeSec === "flags" && (
        <div className="space-y-4">
          {/* ═══ MASTER KILL SWITCH ═══ */}
          <div className={`rounded-2xl p-5 border-2 transition-all ${flags.site_disabled ? "bg-red-50 border-red-400 dark:bg-red-900/20" : "bg-card border-border"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${flags.site_disabled ? "bg-red-100" : "bg-muted"}`}>
                  {flags.site_disabled ? "🔴" : "🟢"}
                </div>
                <div>
                  <h3 className="font-bold text-base">إيقاف الموقع (Kill Switch)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">تفعيل يوقف الموقع فوراً ويعرض رسالة الصيانة</p>
                  <span className={`text-xs font-bold ${flags.site_disabled ? "text-red-600" : "text-green-600"}`}>
                    {flags.site_disabled ? "⚠️ الموقع موقوف الآن" : "✅ الموقع يعمل بشكل طبيعي"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setFlags({ ...flags, site_disabled: !flags.site_disabled })}
                className={`w-14 h-8 rounded-full transition-colors relative shrink-0 mt-1 ${flags.site_disabled ? "bg-red-500" : "bg-muted-foreground/30"}`}
              >
                <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${flags.site_disabled ? "right-1" : "left-1"}`} />
              </button>
            </div>
            <div className="mt-3">
              <label className="text-sm font-medium mb-1 block">رسالة الصيانة</label>
              <input
                value={siteDisabledMsg}
                onChange={e => setSiteDisabledMsg(e.target.value)}
                placeholder="الموقع في وضع الصيانة، يرجى المحاولة لاحقاً"
                className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* ═══ OTHER FLAGS ═══ */}
          <div className="bg-card rounded-2xl p-5 border border-border space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-bold">التحكم بالمميزات</h3>
              <span className="text-xs text-muted-foreground mr-auto">التغييرات تُطبَّق فوراً بعد الحفظ</span>
            </div>
            {Object.entries(flags)
              .filter(([k]) => k !== "site_disabled")
              .map(([key, value]) => {
                const info = flagLabels[key];
                return (
                  <label key={key} className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-xl hover:bg-muted transition-colors">
                    <div>
                      <span className="text-sm font-medium">{info?.label || key}</span>
                      {info?.desc && <span className="block text-xs text-muted-foreground mt-0.5">{info.desc}</span>}
                    </div>
                    <button
                      onClick={() => setFlags({ ...flags, [key]: !value })}
                      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${value ? "bg-primary" : "bg-muted-foreground/30"}`}
                    >
                      <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-card shadow transition-all ${value ? "right-0.5" : "left-0.5"}`} />
                    </button>
                  </label>
                );
              })}
          </div>

          <Button onClick={handleSaveFlags}
            className={`gap-2 w-full ${flags.site_disabled ? "bg-red-600 hover:bg-red-700" : ""}`}>
            <Save className="w-4 h-4" />
            {flags.site_disabled ? "🔴 حفظ وإيقاف الموقع" : "حفظ وتطبيق فوراً"}
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
