import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { findAccount } from "@/lib/accountUtils";

/**
 * Redirects any signed-in local account with `mustResetPassword` to
 * /force-password-reset until a new password is set. Runs on every
 * route change so bookmarks and history navigation can't bypass it.
 */
const ForcePasswordResetGate = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/force-password-reset") return;
    // Allow the sign-in/out screens through in case the user chooses to leave.
    if (
      location.pathname === "/sign-in" ||
      location.pathname === "/sign-up" ||
      location.pathname === "/sso-callback"
    ) {
      return;
    }
    let auth: { email?: string; signedIn?: boolean; mustResetPassword?: boolean } = {};
    try {
      auth = JSON.parse(localStorage.getItem("local-auth") || "{}");
    } catch {
      return;
    }
    if (!auth.signedIn || !auth.email) return;

    const needsReset =
      auth.mustResetPassword || findAccount(auth.email)?.mustResetPassword;
    if (needsReset) {
      navigate("/force-password-reset", { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

export default ForcePasswordResetGate;
