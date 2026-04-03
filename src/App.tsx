import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
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

const queryClient = new QueryClient();

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const AppContent = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/api/bookings/" element={<FellowsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/fellows" element={<BookingsPage />} />
          {/* Role Guard */}
          {/* <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <AdminPage />
              </RoleGuard>
            }
          />
          <Route
            path="/fellows"
            element={
              <RoleGuard allowedRoles={["fellow"]}>
                <FellowsPage />
              </RoleGuard>
            }
          /> */}
          <Route path="/webmaster" element={<WebmasterPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/sso-callback" element={<SSOCallbackPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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
