import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BasketProvider } from "@/contexts/BasketContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlagsContext";
import { SocialLinksProvider } from "@/contexts/SocialLinksContext";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import Policy from "./pages/Policy";
import Zakat from "./pages/Zakat";
import PaymentPage from "./pages/PaymentPage";
import TrackDonation from "./pages/TrackDonation";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import SeoHead from "./components/SeoHead";
import SplashScreen from "./components/SplashScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <FeatureFlagsProvider>
          <SocialLinksProvider>
            <TooltipProvider>
              <BasketProvider>
                <SplashScreen />
                <SeoHead />
                <Toaster />
                <Sonner />
                <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/policy" element={<Policy />} />
                    <Route path="/zakat" element={<Zakat />} />
                    <Route path="/pay" element={<PaymentPage />} />
                    <Route path="/track" element={<TrackDonation />} />
                    <Route path="/install" element={<Install />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </BasketProvider>
            </TooltipProvider>
          </SocialLinksProvider>
        </FeatureFlagsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
