import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { findAccount } from "@/lib/accountUtils";

/**
 * Redirects any signed-in local account with `mustResetPassword` to
 * /force-password-reset until a new password is set. Runs on every
 * route change so bookmarks and history navigation can't bypass it.
 *
 * Also invalidates any local session whose recorded `passwordVersion`
 * is older than the account's current version — this ensures that once
 * a webmaster resets a temporary password, previously-minted sessions
 * (in any tab that shares this storage) are signed out on next
 * navigation and can never be resumed with the old credential.
 */
const ForcePasswordResetGate = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Allow the sign-in/out screens through in case the user chooses to leave.
    const isAuthRoute =
      location.pathname === "/sign-in" ||
      location.pathname === "/sign-up" ||
      location.pathname === "/sso-callback";

    let auth: {
      email?: string;
      signedIn?: boolean;
      mustResetPassword?: boolean;
      passwordVersion?: number;
    } = {};
    try {
      auth = JSON.parse(localStorage.getItem("local-auth") || "{}");
    } catch {
      return;
    }
    if (!auth.signedIn || !auth.email) return;

    const acct = findAccount(auth.email);

    // Stale session: password was rotated after this session was minted.
    if (
      acct &&
      typeof acct.passwordVersion === "number" &&
      (auth.passwordVersion ?? 0) < acct.passwordVersion
    ) {
      localStorage.removeItem("local-auth");
      toast.info("Your session was ended because your password was reset.");
      if (!isAuthRoute) navigate("/sign-in", { replace: true });
      return;
    }

    if (location.pathname === "/force-password-reset") return;
    if (isAuthRoute) return;

    const needsReset = auth.mustResetPassword || acct?.mustResetPassword;
    if (needsReset) {
      navigate("/force-password-reset", { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

export default ForcePasswordResetGate;
