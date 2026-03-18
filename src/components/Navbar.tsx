import { Link, useLocation } from "react-router-dom";
import { Calendar, LayoutDashboard, LogIn, GraduationCap, LogOut, HouseIcon } from "lucide-react";
import { useClerk, useUser } from "@clerk/clerk-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useRole } from "@/lib/roles";

// function useClerkAuth() {
//   try {
//     const { signOut } = useClerk();
//     const { isSignedIn, isLoaded } = useUser();
//     return { isSignedIn: !!isSignedIn, isLoaded, signOut };
//   } catch {
//     return { isSignedIn: false, isLoaded: true, signOut: null };
//   }
// }

const Navbar = () => {
  const location = useLocation();
  const { isAdmin, isFellow } = useRole();
  // const { isSignedIn, signOut } = useClerkAuth();

  const navItems = [
    { to: "/", label: "Home", icon: HouseIcon, show: true },
    { to: "/api/bookings/", label: "Bookings", icon: Calendar, show: true },
    // { to: "/admin", label: "Admin", icon: LayoutDashboard, show: isFellow },
    // { to: "/fellows", label: "Fellows", icon: GraduationCap, show: isFellow },
  ].filter((item) => item.show);

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">BookFlow</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
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
          <ThemeToggle />
          {/* {isSignedIn && signOut ? (
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="ml-2 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : (
            <Link
              to="/sign-in"
              className="ml-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )} */}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
