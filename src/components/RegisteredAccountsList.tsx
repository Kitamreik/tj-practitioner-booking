import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, UserCheck, KeyRound, Copy, Check, Eye, EyeOff, Pencil } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
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

const sortNewestFirst = (list: LocalAccount[]) =>
  [...list].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

const RegisteredAccountsList = () => {
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<LocalAccount | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; name: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [changeTarget, setChangeTarget] = useState<LocalAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    <div className="mt-10">
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
          {accounts.map((acct) => (
            <Card key={acct.email} data-testid={`account-${acct.email}`}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{acct.name}</p>
                    <Badge variant="outline" className={roleBadgeStyles[acct.role] || ""}>
                      {acct.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{acct.email}</p>
                  {acct.createdAt && (
                    <p className="text-[11px] text-muted-foreground">
                      Added {new Date(acct.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResetPassword(acct)}
                    className="gap-1"
                    aria-label={`Reset password for ${acct.email}`}
                  >
                    <KeyRound className="h-3.5 w-3.5" /> Reset password
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
          ))}
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

      <Dialog
        open={!!resetResult}
        onOpenChange={(o) => { if (!o) { setResetResult(null); setCopied(false); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New password generated</DialogTitle>
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
            <p className="text-xs text-muted-foreground">
              Share the new password with the account holder. It will not be shown again.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => { setResetResult(null); setCopied(false); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisteredAccountsList;
