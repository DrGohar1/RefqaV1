import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import HeroSection from "@/components/HeroSection";
import DonationTicker from "@/components/DonationTicker";
import CampaignsSection from "@/components/CampaignsSection";
import MissionSection from "@/components/MissionSection";
import ServicesSection from "@/components/ServicesSection";
import ImpactSection from "@/components/ImpactSection";
import Footer from "@/components/Footer";
import BasketDrawer from "@/components/BasketDrawer";
import HomeBanners from "@/components/HomeBanners";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { AlertTriangle } from "lucide-react";

const MaintenancePage = ({ message }: { message: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 font-body" dir="rtl">
    <div className="text-center max-w-md px-6">
      <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-red-700 mb-3 font-display">الموقع في وضع الصيانة</h1>
      <p className="text-gray-600 text-lg leading-relaxed">{message || "نعمل على تحسين خدماتنا. يرجى المحاولة لاحقاً."}</p>
      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        <span>وضع الصيانة مفعّل</span>
      </div>
    </div>
  </div>
);

const Index = () => {
  const { flags } = useFeatureFlags();

  if (flags.site_disabled) {
    return <MaintenancePage message={String(flags.site_disabled_message || "الموقع في وضع الصيانة، يرجى المحاولة لاحقاً")} />;
  }

  return (
    <div className="min-h-screen font-body">
      <TopBar />
      <Navbar />
      <HeroSection />
      {flags.donation_ticker && <DonationTicker />}
      <HomeBanners />
      <CampaignsSection />
      <MissionSection />
      <ServicesSection />
      <ImpactSection />
      <Footer />
      {flags.basket_system && <BasketDrawer />}
    </div>
  );
};

export default Index;
