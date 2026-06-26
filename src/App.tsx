import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import TripBoardPage from "./pages/TripBoardPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import LocationDetailPage from "./pages/LocationDetailPage";
import SavedPlacesPage from "./pages/SavedPlacesPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminPage from "./pages/AdminPage";
import CommunityRulesPage from "./pages/CommunityRulesPage";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import SOSButton from "./components/SOSButton";
import TutorialOverlay from "./components/TutorialOverlay";
import { ThemeProvider } from "./components/ThemeProvider";
import { useState } from "react";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return showAuth ? <AuthPage /> : <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 pt-4 animate-fade-in overscroll-y-auto">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/trips" element={<TripBoardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/location/:id" element={<LocationDetailPage />} />
          <Route path="/saved" element={<SavedPlacesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/onboarding" element={<OnboardingPage onComplete={() => window.location.href = '/'} />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/rules" element={<CommunityRulesPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <TutorialOverlay />
      <SOSButton />
      <BottomNav />
    </div>
  );
}

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
