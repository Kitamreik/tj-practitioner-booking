import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, UserCheck, KeyRound, Copy, Check, Eye, EyeOff, Pencil, ShieldAlert } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRole } from "@/lib/roles";
import {
  ACCOUNTS_EVENT,
  readAccounts,
  writeAccounts,
  resetAccountPassword,
  setAccountPassword,
  type LocalAccount,
} from "@/lib/accountUtils";

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  fellow: "bg-accent/80 text-accent-foreground border-accent",
  webmaster: "bg-destructive/10 text-destructive border-destructive/20",
};

const REVEAL_TIMEOUT_MS = 15000;

const sortNewestFirst = (list: LocalAccount[]) =>
  [...list].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

// An account is "locally created" (i.e. its password is stored in this app,
// not managed by an external identity provider like Clerk/Google) when it
// has a password field on the local record. External-auth accounts never
// have a plaintext password in localStorage, so we key off that.
const isLocallyManaged = (acct: LocalAccount) =>
  typeof acct.password === "string" && acct.password.length > 0;

const RegisteredAccountsList = () => {
  const { isWebmaster } = useRole();
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<LocalAccount | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; name: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [revealCountdown, setRevealCountdown] = useState<Record<string, number>>({});
  const [revealConfirm, setRevealConfirm] = useState<LocalAccount | null>(null);
  const [changeTarget, setChangeTarget] = useState<LocalAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const loadAccounts = useCallback(() => {
    setAccounts(sortNewestFirst(readAccounts()));
  }, []);

  useEffect(() => {
    loadAccounts();
    const handler = () => loadAccounts();
    window.addEventListener(ACCOUNTS_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(ACCOUNTS_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [loadAccounts]);

  // Clear any pending timers on unmount so revealed passwords never leak
  // past component teardown (e.g. navigating away from the webmaster page).
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => clearInterval(t));
      timersRef.current = {};
    };
  }, []);

  const maskAccount = useCallback((email: string) => {
    const timer = timersRef.current[email];
    if (timer) {
      clearInterval(timer);
      delete timersRef.current[email];
    }
    setRevealed((r) => ({ ...r, [email]: false }));
    setRevealCountdown((c) => {
      const { [email]: _drop, ...rest } = c;
      return rest;
    });
  }, []);

  const startReveal = useCallback((email: string) => {
    // Reset any pre-existing timer for this account.
    const existing = timersRef.current[email];
    if (existing) clearInterval(existing);

    const endsAt = Date.now() + REVEAL_TIMEOUT_MS;
    setRevealed((r) => ({ ...r, [email]: true }));
    setRevealCountdown((c) => ({ ...c, [email]: Math.ceil(REVEAL_TIMEOUT_MS / 1000) }));

    const timer = setInterval(() => {
      const remaining = Math.max(0, endsAt - Date.now());
      if (remaining <= 0) {
        maskAccount(email);
        return;
      }
      setRevealCountdown((c) => ({ ...c, [email]: Math.ceil(remaining / 1000) }));
    }, 500);
    timersRef.current[email] = timer;
  }, [maskAccount]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.role === "webmaster") {
      toast.error("Cannot delete the webmaster account.");
      setDeleteTarget(null);
      return;
    }
    const updated = readAccounts().filter((a) => a.email !== deleteTarget.email);
    writeAccounts(updated);
    setAccounts(sortNewestFirst(updated));
    toast.success(`Deleted account for ${deleteTarget.email}`);
    setDeleteTarget(null);
  };

  const handleResetPassword = (acct: LocalAccount) => {
    const pwd = resetAccountPassword(acct.email);
    if (!pwd) {
      toast.error("Could not reset password.");
      return;
    }
    loadAccounts();
    setResetResult({ email: acct.email, name: acct.name, password: pwd });
    toast.success(`Password reset for ${acct.email}`);
  };

  const copyPassword = async () => {
    if (!resetResult) return;
    try {
      await navigator.clipboard.writeText(resetResult.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Unable to copy — select and copy manually.");
    }
  };

  return (
    <div className="mt-10" data-testid="registered-accounts-section">
      <div className="mb-4 flex items-center gap-2">
        <UserCheck className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-bold text-foreground">Registered Accounts</h2>
        <Badge variant="secondary">{accounts.length}</Badge>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-muted-foreground">No locally registered accounts found.</p>
        </div>
      ) : (
        <div className="space-y-2" data-testid="registered-accounts">
          {accounts.map((acct) => {
            const localManaged = isLocallyManaged(acct);
            const isRevealed = !!revealed[acct.email];
            return (
              <Card key={acct.email} data-testid={`account-${acct.email}`}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{acct.name}</p>
                      <Badge variant="outline" className={roleBadgeStyles[acct.role] || ""}>
                        {acct.role}
                      </Badge>
                      {!localManaged && (
                        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                          External auth
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{acct.email}</p>
                    {acct.createdAt && (
                      <p className="text-[11px] text-muted-foreground">
                        Added {new Date(acct.createdAt).toLocaleString()}
                      </p>
                    )}
                    {localManaged && isWebmaster && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Password:</span>
                        <code
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]"
                          data-testid={`password-value-${acct.email}`}
                        >
                          {isRevealed ? acct.password : "••••••••••"}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          data-testid={`toggle-password-${acct.email}`}
                          onClick={() => {
                            if (isRevealed) {
                              maskAccount(acct.email);
                            } else {
                              setRevealConfirm(acct);
                            }
                          }}
                          aria-label={isRevealed ? "Hide password" : "Show password"}
                        >
                          {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        {isRevealed && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(acct.password!);
                                  toast.success("Password copied");
                                } catch {
                                  toast.error("Copy failed");
                                }
                              }}
                              aria-label="Copy password"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <span
                              className="text-[10px] text-muted-foreground"
                              data-testid={`reveal-countdown-${acct.email}`}
                            >
                              hides in {revealCountdown[acct.email] ?? 0}s
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {localManaged && isWebmaster && (
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`change-password-${acct.email}`}
                        onClick={() => {
                          setChangeTarget(acct);
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        className="gap-1"
                        aria-label={`Change password for ${acct.email}`}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Change password
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetPassword(acct)}
                      className="gap-1"
                      aria-label={`Reset password for ${acct.email}`}
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Reset
                    </Button>
                    {acct.role !== "webmaster" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(acct)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm-before-reveal dialog. The password is only unmasked after
          the webmaster explicitly acknowledges this modal, and it auto-masks
          again 15 seconds later. */}
      <AlertDialog
        open={!!revealConfirm}
        onOpenChange={(o) => { if (!o) setRevealConfirm(null); }}
      >
        <AlertDialogContent data-testid="reveal-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Reveal password?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You're about to display the plaintext password for{" "}
              <strong>{revealConfirm?.email}</strong>. It will auto-hide after{" "}
              {REVEAL_TIMEOUT_MS / 1000} seconds. Make sure no one else can see your screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-reveal-btn"
              onClick={() => {
                if (revealConfirm) startReveal(revealConfirm.email);
                setRevealConfirm(null);
              }}
            >
              Show for {REVEAL_TIMEOUT_MS / 1000}s
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!resetResult}
        onOpenChange={(o) => { if (!o) { setResetResult(null); setCopied(false); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New password generated</DialogTitle>
            <DialogDescription>
              Share this password securely — it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm">
              A new password has been set for <strong>{resetResult?.name}</strong> ({resetResult?.email}).
            </p>
            <div className="flex items-center gap-2 rounded-md border bg-background p-2">
              <span className="flex-1 truncate font-mono text-sm">{resetResult?.password}</span>
              <Button variant="ghost" size="sm" onClick={copyPassword} className="gap-1">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setResetResult(null); setCopied(false); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!changeTarget}
        onOpenChange={(o) => { if (!o) { setChangeTarget(null); setNewPassword(""); setConfirmPassword(""); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Set a new password for the selected local account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Set a new password for <strong>{changeTarget?.name}</strong> ({changeTarget?.email}).
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New password</label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="font-mono"
                placeholder="Min 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirm password</label>
              <Input
                type="text"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setChangeTarget(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!changeTarget) return;
                if (newPassword.length < 8) {
                  toast.error("Password must be at least 8 characters.");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast.error("Passwords do not match.");
                  return;
                }
                const ok = setAccountPassword(changeTarget.email, newPassword);
                if (ok) {
                  toast.success(`Password updated for ${changeTarget.email}`);
                  loadAccounts();
                  setChangeTarget(null);
                  setNewPassword("");
                  setConfirmPassword("");
                } else {
                  toast.error("Could not update password.");
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisteredAccountsList;
