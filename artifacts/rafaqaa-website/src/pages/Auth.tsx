import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Lock, User } from "lucide-react";
import logoStamp from "@/assets/logo-stamp.jpg";

const Auth = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signIn } = useAuth();

  useEffect(() => {
    if (user) navigate("/admin");
  }, [user, navigate]);

  const handleLogin = async () => {
    if (!username || !password) {
      toast({ title: "خطأ", description: "يُرجى إدخال اسم المستخدم وكلمة المرور", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signIn(username, password);
    setLoading(false);
    if (error) {
      toast({ title: "خطأ في تسجيل الدخول", description: error, variant: "destructive" });
    } else {
      toast({ title: "تم تسجيل الدخول بنجاح" });
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-background font-body flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-elevated p-8 space-y-6 border border-border"
      >
        <div className="text-center space-y-2">
          <img src={logoStamp} alt="الشعار" className="w-16 h-16 rounded-full mx-auto object-cover" />
          <h1 className="font-display text-2xl font-bold text-primary">لوحة الإدارة</h1>
          <p className="text-sm text-muted-foreground">مؤسسة رفقاء البررة</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="اسم المستخدم"
              className="pr-10"
              dir="ltr"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div className="relative">
            <Lock className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="pr-10"
              dir="ltr"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        <Button onClick={handleLogin} disabled={loading} className="w-full">
          {loading ? "جاري التحقق..." : "دخول إلى لوحة الإدارة"}
        </Button>

        <div className="text-center">
          <a href="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowRight className="w-4 h-4" /> العودة للموقع
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
