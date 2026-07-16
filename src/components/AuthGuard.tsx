import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import type { AppRole } from "@/lib/roles";

interface AuthGuardProps {
  children: React.ReactNode;
  /** If provided, the signed-in user's role must be in this list. */
  allowedRoles?: AppRole[];
  /** Where to send unauthenticated users. Defaults to /sign-in. */
  redirectTo?: string;
  /** Where to send signed-in users who lack the required role. */
  forbiddenPath?: string;
}

interface LocalAuth {
  email?: string;
  signedIn?: boolean;
  role?: AppRole;
  mustResetPassword?: boolean;
}

const readLocalAuth = (): LocalAuth => {
  try {
    return JSON.parse(localStorage.getItem("local-auth") || "{}");
  } catch {
    return {};
  }
};

/**
 * Guards a route so it can only be reached with a valid session. Blocks
 * both unauthenticated visitors and cross-role manual URL entry.
 *
 * - Unauthenticated → redirect to `redirectTo` (default `/sign-in`) with
 *   `?next=<original path>` so the sign-in flow can bounce back.
 * - Signed in but role is not in `allowedRoles` → redirect to
 *   `forbiddenPath` (default `/`).
 * - Signed in but flagged `mustResetPassword` → redirect to
 *   `/force-password-reset` (the global gate also enforces this).
 */
const AuthGuard = ({
  children,
  allowedRoles,
  redirectTo = "/sign-in",
  forbiddenPath = "/",
}: AuthGuardProps) => {
  const location = useLocation();

  // Clerk state (if configured)
  let clerkLoaded = true;
  let clerkUser: ReturnType<typeof useUser>["user"] = null;
  try {
    const { user, isLoaded } = useUser();
    clerkLoaded = isLoaded;
    clerkUser = user ?? null;
  } catch {
    // Clerk not available — treat as loaded with no user.
    clerkLoaded = true;
  }

  // Track local-auth changes so signing out in another tab kicks the user.
  const [localAuth, setLocalAuth] = useState<LocalAuth>(() => readLocalAuth());
  useEffect(() => {
    const refresh = () => setLocalAuth(readLocalAuth());
    window.addEventListener("storage", refresh);
    window.addEventListener("registered-accounts:changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("registered-accounts:changed", refresh);
    };
  }, []);

  if (!clerkLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const clerkSignedIn = !!clerkUser;
  const localSignedIn = !!localAuth.signedIn && !!localAuth.email;
  const signedIn = clerkSignedIn || localSignedIn;

  if (!signedIn) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectTo}?next=${next}`} replace />;
  }

  if (localSignedIn && localAuth.mustResetPassword) {
    return <Navigate to="/force-password-reset" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Clerk-authenticated users (e.g. Google OAuth) without explicit
    // publicMetadata.role are treated as "webmaster" so they can reach
    // both the admin and webmaster pages. Local-auth users keep their
    // seeded role.
    const role: AppRole = clerkSignedIn
      ? ((clerkUser?.publicMetadata?.role as AppRole) || "webmaster")
      : ((localAuth.role as AppRole) || "fellow");
    if (!allowedRoles.includes(role)) {
      return <Navigate to={forbiddenPath} replace />;
    }
  }

  return <>{children}</>;
};

export default AuthGuard;
