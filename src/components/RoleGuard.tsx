import { useRole, type AppRole } from "@/lib/roles";
import { Navigate } from "react-router-dom";

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}

const RoleGuard = ({ allowedRoles, children, fallbackPath = "/" }: RoleGuardProps) => {
  const { role, isLoaded } = useRole();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
