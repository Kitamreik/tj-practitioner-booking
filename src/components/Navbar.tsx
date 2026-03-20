import { Link, useLocation } from "react-router-dom";
import { Calendar, LayoutDashboard, LogIn, GraduationCap, LogOut, HouseIcon, Menu, X, BookOpen } from "lucide-react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useRole } from "@/lib/roles";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function useClerkAuth() {
  try {
    const { signOut } = useClerk();
    const { isSignedIn, isLoaded } = useUser();
    return { isSignedIn: !!isSignedIn, isLoaded, signOut };
  } catch {
    return { isSignedIn: false, isLoaded: true, signOut: null };
  }
}

const Navbar = () => {
  const location = useLocation();
  const { isAdmin, isFellow } = useRole();
  const { isSignedIn, signOut } = useClerkAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Home", icon: HouseIcon, show: true },
    { to: "/reservations", label: "Reservations", icon: BookOpen, show: true },
    { to: "/api/bookings/", label: "Bookings", icon: Calendar, show: true },
    { to: "/admin", label: "Admin", icon: LayoutDashboard, show: false },
    { to: "/fellows", label: "Fellows", icon: GraduationCap, show: false },
  ].filter((item) => item.show);

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClick}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  const AuthButton = ({ onClick }: { onClick?: () => void }) =>
    isSignedIn && signOut ? (
      <button
        onClick={() => {
          signOut({ redirectUrl: "/" });
          onClick?.();
        }}
        className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    ) : (
      <Link
        to="/sign-in"
        onClick={onClick}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <LogIn className="h-4 w-4" />
        Sign In
      </Link>
    );

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">BookFlow</span>
        </Link>

        {isMobile ? (
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <nav className="mt-8 flex flex-col gap-2">
                  <NavItems onClick={() => setOpen(false)} />
                  <div className="mt-4">
                    <AuthButton onClick={() => setOpen(false)} />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <nav className="flex items-center gap-1">
            <NavItems />
            <ThemeToggle />
            <div className="ml-2">
              <AuthButton />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
