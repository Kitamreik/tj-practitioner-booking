import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
// import RoleGuard from "@/components/RoleGuard";
import Index from "./pages/Index";
import BookingsPage from "./pages/BookingsPage";
import AdminPage from "./pages/AdminPage";
import FellowsPage from "./pages/FellowsPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import NotFound from "./pages/NotFound";
import ReservationsPage from "./pages/ReservationsPage";
import SSOCallbackPage from "./pages/SSOCallbackPage";
import WebmasterPage from "./pages/WebmasterPage";
import PracticumPage from "./pages/PracticumPage";
import ProfilePage from "./pages/ProfilePage";
import LegalPage from "./pages/LegalPage";
import ForcePasswordResetPage from "./pages/ForcePasswordResetPage";
import ForcePasswordResetGate from "@/components/ForcePasswordResetGate";
import AuthGuard from "@/components/AuthGuard";
import AuthTokenBridge from "@/components/AuthTokenBridge";

const queryClient = new QueryClient();

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const AppContent = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthTokenBridge />
        <Navbar />
        <ForcePasswordResetGate />
        <div className="pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/reservations"
            element={
              <AuthGuard>
                <ReservationsPage />
              </AuthGuard>
            }
          />
          <Route path="/api/bookings/" element={<FellowsPage />} />
          <Route
            path="/admin"
            element={
              <AuthGuard allowedRoles={["admin", "webmaster"]}>
                <AdminPage />
              </AuthGuard>
            }
          />
          <Route
            path="/fellows"
            element={
              <AuthGuard allowedRoles={["fellow", "admin", "webmaster"]}>
                <BookingsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/practicum"
            element={
              <AuthGuard>
                <PracticumPage />
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            }
          />
          <Route
            path="/webmaster"
            element={
              <AuthGuard allowedRoles={["webmaster"]}>
                <WebmasterPage />
              </AuthGuard>
            }
          />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/sso-callback" element={<SSOCallbackPage />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="/force-password-reset" element={<ForcePasswordResetPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </div>
        <Footer />
        <MobileBottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const App = () => {
  if (!CLERK_PUBLISHABLE_KEY) {
    console.warn(
      "VITE_CLERK_PUBLISHABLE_KEY is not set. Running without Clerk authentication. " +
      "Add the key to your .env.local file to enable auth."
    );
    return <AppContent />;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AppContent />
    </ClerkProvider>
  );
};

export default App;
