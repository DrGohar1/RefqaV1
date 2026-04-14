import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, LogOut, User, Lock, Shield } from "lucide-react";
import logoStamp from "@/assets/logo-stamp.jpg";
import api from "@/lib/api-client";

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [saving, setSaving] = useState(false);

  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      toast({ title: "خطأ", description: "يُرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    if (newPw.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
      toast({ title: "✅ تم تغيير كلمة المرور بنجاح" });
      setCurrentPw("");
      setNewPw("");
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body" dir="rtl">
      <div className="gradient-hero text-primary-foreground py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground text-sm">
              <ArrowRight className="w-4 h-4" /> العودة للموقع
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="w-4 h-4 ml-2" /> خروج
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">{user?.username}</h1>
              <p className="text-primary-foreground/60 text-sm flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {user?.role === "admin" ? "مدير النظام" : "مشرف"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card border border-border p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-bold">تغيير كلمة المرور</h2>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">كلمة المرور الحالية</label>
            <Input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="أدخل كلمة المرور الحالية"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">كلمة المرور الجديدة</label>
            <Input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
              dir="ltr"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={saving} className="w-full">
            {saving ? "جاري الحفظ..." : "تغيير كلمة المرور"}
          </Button>
        </motion.div>

        <div className="mt-6 text-center">
          <Link to="/admin">
            <Button variant="outline" className="gap-2">
              <Shield className="w-4 h-4" /> الذهاب إلى لوحة الإدارة
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
