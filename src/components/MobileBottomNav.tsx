import { Link, useLocation } from "react-router-dom";
import { Calendar, LayoutDashboard, GraduationCap, HouseIcon, ClipboardList, UserCircle, Shield } from "lucide-react";
import { useRole } from "@/lib/roles";

const MobileBottomNav = () => {
  const location = useLocation();
  const { isAdmin, isFellow, isWebmaster } = useRole();

  const navItems = [
    { to: "/", label: "Home", icon: HouseIcon, show: true },
    { to: "/api/bookings/", label: "Bookings", icon: Calendar, show: isFellow },
    { to: "/fellows", label: "Fellows", icon: GraduationCap, show: isFellow },
    { to: "/practicum", label: "Practicum", icon: ClipboardList, show: isFellow },
    { to: "/profile", label: "Profile", icon: UserCircle, show: isFellow },
    { to: "/admin", label: "Admin", icon: LayoutDashboard, show: isWebmaster || isAdmin },
    { to: "/webmaster", label: "Webmaster", icon: Shield, show: isWebmaster || isAdmin },
  ].filter((item) => item.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
