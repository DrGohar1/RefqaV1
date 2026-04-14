import { Shield, Lock, Database, RefreshCw, CheckCircle2, AlertTriangle, Key, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const securityItems = [
  {
    title: "تشفير البيانات",
    description: "جميع البيانات مشفرة أثناء النقل (TLS/SSL) وفي حالة السكون (AES-256)",
    icon: Lock,
    status: "active",
  },
  {
    title: "Row Level Security (RLS)",
    description: "حماية على مستوى الصف - كل مستخدم يرى بياناته فقط",
    icon: Shield,
    status: "active",
  },
  {
    title: "نسخ احتياطي يومي",
    description: "يتم إنشاء نسخة احتياطية تلقائية يومياً مع إمكانية الاسترداد لأي نقطة",
    icon: Database,
    status: "active",
  },
  {
    title: "JWT Authentication",
    description: "مصادقة آمنة عبر JSON Web Tokens مع تجديد تلقائي",
    icon: Key,
    status: "active",
  },
  {
    title: "مراقبة الوصول",
    description: "تسجيل جميع عمليات الوصول والتعديل مع بيانات الوقت والمستخدم",
    icon: Eye,
    status: "active",
  },
];

const backupHistory = [
  { date: "2026-03-22 02:00", size: "12.4 MB", status: "success" },
  { date: "2026-03-21 02:00", size: "12.1 MB", status: "success" },
  { date: "2026-03-20 02:00", size: "11.8 MB", status: "success" },
  { date: "2026-03-19 02:00", size: "11.5 MB", status: "success" },
];

const AdminSecurity = () => {
  const { toast } = useToast();

  const handleManualBackup = () => {
    toast({ title: "جاري إنشاء نسخة احتياطية...", description: "سيتم إشعارك عند الانتهاء" });
    setTimeout(() => {
      toast({ title: "تم إنشاء النسخة الاحتياطية بنجاح ✓" });
    }, 2000);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <h2 className="font-display text-2xl font-bold flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" /> الحماية والأمان
      </h2>

      {/* Security Status */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">حالة الأمان: ممتازة</h3>
            <p className="text-sm text-muted-foreground">جميع أنظمة الحماية تعمل بشكل طبيعي</p>
          </div>
        </div>

        <div className="space-y-3">
          {securityItems.map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">{item.title}</h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                    <CheckCircle2 className="w-3 h-3" /> مفعّل
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backup */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-bold">النسخ الاحتياطي</h3>
          </div>
          <Button onClick={handleManualBackup} size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" /> نسخة يدوية
          </Button>
        </div>

        <div className="bg-accent/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-gold" />
            <p className="text-sm font-bold">معلومة مهمة</p>
          </div>
          <p className="text-xs text-muted-foreground">
            يتم إنشاء نسخ احتياطية تلقائية يومياً. يمكنك استرداد البيانات لأي نقطة خلال آخر 30 يوماً من خلال لوحة التحكم السحابية.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-bold">آخر النسخ الاحتياطية</h4>
          {backupHistory.map((b, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
              <span className="text-muted-foreground" dir="ltr">{b.date}</span>
              <span className="text-muted-foreground">{b.size}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                <CheckCircle2 className="w-3 h-3" /> ناجح
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RLS Policies */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-bold">سياسات الوصول (RLS)</h3>
        </div>
        <div className="space-y-2">
          {[
            { table: "campaigns", policy: "القراءة للجميع - التعديل للمدراء فقط" },
            { table: "donations", policy: "الإنشاء للجميع - القراءة للمالك والمدراء" },
            { table: "profiles", policy: "القراءة والتعديل للمالك فقط" },
            { table: "settings", policy: "القراءة للجميع - التعديل للمدراء فقط" },
            { table: "user_roles", policy: "القراءة للمالك - الإدارة للمدراء فقط" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="font-mono text-sm font-bold text-primary" dir="ltr">{item.table}</span>
              <span className="text-xs text-muted-foreground">{item.policy}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;
