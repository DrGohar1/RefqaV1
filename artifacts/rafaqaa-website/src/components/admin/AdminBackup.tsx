import { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Upload, Clock, Database, FileJson, FileSpreadsheet,
  CheckCircle2, Loader2, Save, RefreshCw, ShieldCheck, Calendar
} from "lucide-react";

interface BackupStats {
  total_donations: number;
  total_campaigns: number;
  approved_donations: number;
  pending_donations: number;
  total_raised: number;
}

export default function AdminBackup() {
  const { toast } = useToast();
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [schedule, setSchedule] = useState({ frequency: "weekly", email: "", enabled: false });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const lastBackup = localStorage.getItem("last_backup_time");

  async function load() {
    setLoading(true);
    try {
      const [s, sch] = await Promise.all([
        api.get<BackupStats>("/backup/stats"),
        api.get<any>("/backup/schedule"),
      ]);
      setStats(s);
      setSchedule({ frequency: sch.frequency || "weekly", email: sch.email || "", enabled: sch.enabled || false });
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function downloadBackup(format: "json" | "csv") {
    setDownloading(format);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const url = `${base}/api/backup/export?format=${format}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("فشل التحميل");
      const blob = await response.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `rafaqaa_backup_${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(objUrl);
      localStorage.setItem("last_backup_time", new Date().toISOString());
      toast({ title: `✅ تم تحميل النسخة الاحتياطية (${format.toUpperCase()})` });
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setDownloading(null); }
  }

  async function saveSchedule() {
    setSavingSchedule(true);
    try {
      await api.post("/backup/schedule", schedule);
      toast({ title: "✅ تم حفظ جدول النسخ الاحتياطي" });
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    finally { setSavingSchedule(false); }
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold font-display flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> النسخ الاحتياطي والاسترداد
        </h2>
        <p className="text-sm text-muted-foreground mt-1">تصدير واستيراد بيانات المنظّمة بشكل آمن</p>
      </div>

      {/* Stats */}
      {!loading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "إجمالي التبرعات", val: stats.total_donations, color: "text-primary" },
            { label: "المعتمدة", val: stats.approved_donations, color: "text-green-600" },
            { label: "قيد المراجعة", val: stats.pending_donations, color: "text-amber-600" },
            { label: "الإجمالي المحصّل", val: formatCurrency(stats.total_raised), color: "text-blue-600" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-card rounded-xl border border-border p-4 text-center">
              <p className={`text-xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Last backup info */}
      {lastBackup && (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl p-4 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">آخر نسخة احتياطية</p>
            <p className="text-xs text-green-700 dark:text-green-400">{new Date(lastBackup).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
      )}

      {/* Manual backup */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">النسخ الاحتياطي اليدوي</h3>
            <p className="text-xs text-muted-foreground">تحميل كامل البيانات (حملات + تبرعات + إعدادات)</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="border border-border rounded-xl p-4 space-y-3 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2">
              <FileJson className="w-6 h-6 text-blue-500" />
              <div>
                <p className="font-bold text-sm">JSON كامل</p>
                <p className="text-xs text-muted-foreground">كل البيانات في ملف واحد قابل للاستيراد</p>
              </div>
            </div>
            <Button onClick={() => downloadBackup("json")} disabled={downloading === "json"} className="w-full gap-2" variant="outline">
              {downloading === "json" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading === "json" ? "جاري التحميل..." : "تحميل JSON"}
            </Button>
          </div>

          <div className="border border-border rounded-xl p-4 space-y-3 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-bold text-sm">CSV التبرعات</p>
                <p className="text-xs text-muted-foreground">جاهز للفتح في Excel / Google Sheets</p>
              </div>
            </div>
            <Button onClick={() => downloadBackup("csv")} disabled={downloading === "csv"} className="w-full gap-2" variant="outline">
              {downloading === "csv" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading === "csv" ? "جاري التحميل..." : "تحميل CSV"}
            </Button>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
          <span className="text-base">💡</span>
          <span>احفظ النسخ الاحتياطية في مكان آمن (Google Drive / Dropbox). يُنصح بالنسخ الأسبوعي على الأقل.</span>
        </div>
      </div>

      {/* Auto backup schedule */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold">جدولة النسخ التلقائي</h3>
            <p className="text-xs text-muted-foreground">إرسال نسخة احتياطية تلقائية لبريدك الإلكتروني</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">تفعيل النسخ التلقائي</p>
              <p className="text-xs text-muted-foreground">يتطلب إعداد البريد الإلكتروني في قسم الإشعارات</p>
            </div>
            <input type="checkbox" checked={schedule.enabled} onChange={e => setSchedule(s => ({ ...s, enabled: e.target.checked }))}
              className="w-5 h-5 rounded accent-primary" />
          </label>

          <div>
            <label className="text-sm font-medium mb-1 block">تكرار النسخ</label>
            <select value={schedule.frequency} onChange={e => setSchedule(s => ({ ...s, frequency: e.target.value }))}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">البريد الإلكتروني للإرسال</label>
            <Input value={schedule.email} onChange={e => setSchedule(s => ({ ...s, email: e.target.value }))}
              placeholder="backup@rafaqaa.org" dir="ltr" />
          </div>

          <Button onClick={saveSchedule} disabled={savingSchedule} className="w-full gap-2">
            {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingSchedule ? "جاري الحفظ..." : "حفظ الجدول الزمني"}
          </Button>
        </div>
      </div>

      {/* Import section */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold">استيراد البيانات</h3>
            <p className="text-xs text-muted-foreground">استعادة من ملف JSON محفوظ مسبقاً</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-2">
          <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">اسحب ملف JSON هنا أو</p>
          <Button variant="outline" size="sm" onClick={() => toast({ title: "قريباً", description: "ميزة الاستيراد ستُتاح في التحديث القادم" })}>
            اختر ملفاً
          </Button>
          <p className="text-xs text-muted-foreground">JSON فقط — حجم أقصى 50MB</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-3 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
          <span className="text-base">⚠️</span>
          <span>الاستيراد سيُضيف البيانات الجديدة فقط ولن يُحذف الموجود. تأكد من صحة الملف قبل الاستيراد.</span>
        </div>
      </div>
    </div>
  );
}
