import { Link, useLocation } from "react-router-dom";
import { Calendar, LayoutDashboard, LogIn } from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Home", icon: Calendar },
    { to: "/bookings", label: "Bookings", icon: Calendar },
    { to: "/admin", label: "Admin", icon: LayoutDashboard },
  ];

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
          <Link
            to="/sign-in"
            className="ml-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
