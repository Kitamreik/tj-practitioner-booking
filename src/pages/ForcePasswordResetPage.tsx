import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShieldAlert, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { setAccountPassword, findAccount } from "@/lib/accountUtils";

interface LocalAuth {
  email?: string;
  name?: string;
  role?: string;
  signedIn?: boolean;
  mustResetPassword?: boolean;
}

const readLocalAuth = (): LocalAuth => {
  try {
    return JSON.parse(localStorage.getItem("local-auth") || "{}");
  } catch {
    return {};
  }
};

const ForcePasswordResetPage = () => {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<LocalAuth>(() => readLocalAuth());
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth.signedIn || !auth.email) {
      navigate("/sign-in", { replace: true });
      return;
    }
    // If somehow the flag was already cleared, don't trap the user here.
    const acct = findAccount(auth.email);
    if (!auth.mustResetPassword && !acct?.mustResetPassword) {
      navigate("/", { replace: true });
    }
  }, [auth, navigate]);

  const validate = (): string | null => {
    if (pwd.length < 10) return "Password must be at least 10 characters.";
    if (pwd.length > 200) return "Password is too long.";
    if (!/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      return "Password must contain both letters and numbers.";
    }
    if (pwd !== confirm) return "Passwords do not match.";
    const acct = auth.email ? findAccount(auth.email) : undefined;
    if (acct?.password && acct.password === pwd) {
      return "New password must be different from the temporary one.";
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.email) return;
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setBusy(true);
    try {
      const ok = setAccountPassword(auth.email, pwd);
      if (!ok) {
        toast.error("Could not update password — account not found.");
        return;
      }
      const next: LocalAuth = { ...auth, mustResetPassword: false };
      localStorage.setItem("local-auth", JSON.stringify(next));
      setAuth(next);
      toast.success("Password updated. Welcome!");
      navigate("/", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("local-auth");
    navigate("/sign-in", { replace: true });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account was created with a temporary password. Please choose a
            new one to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-card p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="new-password"
                aria-label="New password"
                placeholder="At least 10 characters"
                className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                aria-label="Confirm new password"
                placeholder="Re-enter password"
                className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Requirements: minimum 10 characters, must include letters and
            numbers, and must differ from your temporary password.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-heading text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Update password
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel and sign out
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordResetPage;
