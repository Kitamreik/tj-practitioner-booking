import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShieldAlert, ArrowRight, Check, X, Eye, EyeOff } from "lucide-react";
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
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const tempPassword = auth.email ? findAccount(auth.email)?.password : undefined;

  // Real-time rule evaluation — each rule is independent so users can see
  // exactly which requirement is failing as they type.
  const rules = useMemo(() => {
    return [
      {
        id: "length",
        label: "At least 10 characters",
        passed: pwd.length >= 10,
      },
      {
        id: "max",
        label: "No more than 200 characters",
        passed: pwd.length > 0 && pwd.length <= 200,
      },
      {
        id: "letter",
        label: "Contains a letter (A–Z, a–z)",
        passed: /[A-Za-z]/.test(pwd),
      },
      {
        id: "number",
        label: "Contains a number (0–9)",
        passed: /[0-9]/.test(pwd),
      },
      {
        id: "different",
        label: "Different from your temporary password",
        passed: pwd.length > 0 && (!tempPassword || pwd !== tempPassword),
      },
      {
        id: "match",
        label: "New password and confirmation match",
        passed: pwd.length > 0 && pwd === confirm,
      },
    ];
  }, [pwd, confirm, tempPassword]);

  // Strength score 0–5 based on length, character variety, and symbols.
  const strength = useMemo(() => {
    if (!pwd) return { score: 0, label: "Empty", color: "bg-muted" };
    let score = 0;
    if (pwd.length >= 10) score++;
    if (pwd.length >= 14) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const table: { label: string; color: string }[] = [
      { label: "Very weak", color: "bg-destructive" },
      { label: "Weak", color: "bg-destructive/80" },
      { label: "Fair", color: "bg-amber-500" },
      { label: "Good", color: "bg-amber-400" },
      { label: "Strong", color: "bg-emerald-500" },
      { label: "Excellent", color: "bg-emerald-600" },
    ];
    return { score, ...table[score] };
  }, [pwd]);

  const allPassed = rules.every((r) => r.passed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.email) return;
    if (!allPassed) {
      const first = rules.find((r) => !r.passed);
      toast.error(first ? first.label : "Password does not meet requirements.");
      return;
    }
    setBusy(true);
    try {
      const ok = setAccountPassword(auth.email, pwd);
      if (!ok) {
        toast.error("Could not update password — account not found.");
        return;
      }
      // setAccountPassword bumps the stored session's passwordVersion
      // in place; re-read so our local state reflects that.
      const nextAuth = readLocalAuth();
      const merged: LocalAuth = { ...nextAuth, mustResetPassword: false };
      localStorage.setItem("local-auth", JSON.stringify(merged));
      setAuth(merged);
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
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
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="new-password"
                aria-label="New password"
                aria-describedby="password-rules password-strength"
                placeholder="At least 10 characters"
                className="h-11 w-full rounded-lg border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength meter */}
            <div id="password-strength" className="mt-2" aria-live="polite">
              <div
                className="flex h-1.5 gap-1"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={5}
                aria-valuenow={strength.score}
                aria-label={`Password strength: ${strength.label}`}
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 rounded-full transition-colors ${
                      i < strength.score ? strength.color : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Strength: <span className="font-medium text-foreground">{strength.label}</span>
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                aria-label="Confirm new password"
                placeholder="Re-enter password"
                className="h-11 w-full rounded-lg border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Live requirements checklist */}
          <ul
            id="password-rules"
            aria-live="polite"
            className="space-y-1.5 rounded-lg border bg-muted/30 p-3"
          >
            {rules.map((r) => (
              <li
                key={r.id}
                className={`flex items-center gap-2 text-xs ${
                  r.passed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                }`}
              >
                {r.passed ? (
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <span>{r.label}</span>
              </li>
            ))}
          </ul>

          <button
            type="submit"
            disabled={busy || !allPassed}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-heading text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
