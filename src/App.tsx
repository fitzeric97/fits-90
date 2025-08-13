import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Home from "./pages/Home";
import ConnectPage from "./pages/ConnectPage";

import AuthCallback from "./pages/AuthCallback";
import InstagramCallback from "./pages/InstagramCallback";
import GmailCallback from "./pages/GmailCallback";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import InteractiveOnboarding from "./components/onboarding/InteractiveOnboarding";
import Closet from "./pages/Closet";
import ClosetItemDetail from "./pages/ClosetItemDetail";
import Fits from "./pages/Fits";
import Likes from "./pages/Likes";
import Brands from "./pages/Brands";
import BrandPromotions from "./pages/BrandPromotions";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import ConnectionProfile from "./pages/ConnectionProfile";

const queryClient = new QueryClient();

console.log('App.tsx component loading...');

const App = () => {
  console.log('App component rendering...');
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Index />} />
            <Route path="/login" element={<Index />} />
            <Route path="/signup" element={<Index />} />
            <Route path="/welcome" element={<Index />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/instagram-callback" element={<InstagramCallback />} />
            <Route path="/gmail-callback" element={<GmailCallback />} />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <InteractiveOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/closet" element={
              <ProtectedRoute>
                <Closet />
              </ProtectedRoute>
            } />
            <Route path="/closet/:id" element={
              <ProtectedRoute>
                <ClosetItemDetail />
              </ProtectedRoute>
            } />
            <Route path="/fits" element={
              <ProtectedRoute>
                <Fits />
              </ProtectedRoute>
            } />
            <Route path="/likes" element={
              <ProtectedRoute>
                <Likes />
              </ProtectedRoute>
            } />
            <Route path="/connect" element={
              <ProtectedRoute>
                <ConnectPage />
              </ProtectedRoute>
            } />
            <Route path="/brands" element={
              <ProtectedRoute>
                <Brands />
              </ProtectedRoute>
            } />
            <Route path="/brand-promotions/:brandName" element={
              <ProtectedRoute>
                <BrandPromotions />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <ConnectionProfile />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;