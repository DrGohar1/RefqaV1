import { Link } from "react-router-dom";
import { ArrowRight, Shield, FileText, Scale } from "lucide-react";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";

const Policy = () => {
  return (
    <div className="min-h-screen font-body" dir="rtl">
      <TopBar />
      <Navbar />

      <div className="container py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-8">
          <ArrowRight className="w-4 h-4" /> العودة للرئيسية
        </Link>

        <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">السياسات والشروط</h1>

        {/* Privacy Policy */}
        <section className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold">سياسة الخصوصية</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>تلتزم مؤسسة رفقاء البررة للتنمية والخدمات الدينية والاجتماعية بحماية خصوصية بيانات المتبرعين والمستفيدين.</p>
            <h3 className="font-bold text-foreground">البيانات التي نجمعها:</h3>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>الاسم الكامل ورقم الهاتف للتواصل بخصوص التبرعات</li>
              <li>البريد الإلكتروني (اختياري) لإرسال تحديثات الحملات</li>
              <li>بيانات التحويل المالي لتأكيد وصول التبرعات</li>
            </ul>
            <h3 className="font-bold text-foreground">كيف نستخدم بياناتك:</h3>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تأكيد وتوثيق التبرعات</li>
              <li>التواصل بخصوص حالة التبرع</li>
              <li>إرسال تقارير الأثر والشفافية</li>
              <li>تحسين خدماتنا</li>
            </ul>
            <h3 className="font-bold text-foreground">حماية البيانات:</h3>
            <p>نستخدم تقنيات تشفير متقدمة (SSL/TLS) لحماية بياناتك. لا نشارك أي بيانات شخصية مع أطراف ثالثة دون موافقتك الصريحة.</p>
          </div>
        </section>

        {/* Terms */}
        <section className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold">شروط الاستخدام</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>باستخدامك لمنصة رفقاء البررة، فإنك توافق على الشروط التالية:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>جميع التبرعات طوعية ولا يمكن استردادها بعد اعتمادها</li>
              <li>التبرعات تذهب للحملات المحددة أو لأوجه الخير حسب اختيارك</li>
              <li>المؤسسة مسؤولة عن إيصال التبرعات لمستحقيها بأمانة</li>
              <li>تحتفظ المؤسسة بحق مراجعة وتأكيد التبرعات قبل اعتمادها</li>
              <li>يجب تقديم بيانات صحيحة عند التبرع</li>
            </ul>
          </div>
        </section>

        {/* Refund */}
        <section className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold">سياسة الاسترداد</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>التبرعات التي تم اعتمادها وتوزيعها لا يمكن استردادها. في حال وجود خطأ في المبلغ أو رغبتك في تعديل تبرع قيد المراجعة، يمكنك التواصل مع الإدارة عبر واتساب.</p>
            <p>التبرعات التي لم يتم اعتمادها بعد يمكن إلغاؤها بالتواصل مع المؤسسة.</p>
          </div>
        </section>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>مؤسسة رفقاء البررة للتنمية والخدمات الدينية والاجتماعية</p>
          <p>إشهار رقم 7932 - وزارة التضامن الاجتماعي</p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Policy;
