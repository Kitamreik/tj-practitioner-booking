import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, UserCheck } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface LocalAccount {
  email: string;
  name: string;
  role: string;
  signedIn: boolean;
  createdAt?: string;
}

const ACCOUNTS_KEY = "registered_accounts";

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  fellow: "bg-accent/80 text-accent-foreground border-accent",
  webmaster: "bg-destructive/10 text-destructive border-destructive/20",
};

const RegisteredAccountsList = () => {
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<LocalAccount | null>(null);

  const loadAccounts = useCallback(() => {
    const stored: LocalAccount[] = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    setAccounts(stored);
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.role === "webmaster") {
      toast.error("Cannot delete the webmaster account.");
      setDeleteTarget(null);
      return;
    }
    const updated = accounts.filter((a) => a.email !== deleteTarget.email);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
    setAccounts(updated);
    toast.success(`Deleted account for ${deleteTarget.email}`);
    setDeleteTarget(null);
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
        <div className="space-y-2">
          {accounts.map((acct) => (
            <Card key={acct.email}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{acct.name}</p>
                    <Badge variant="outline" className={roleBadgeStyles[acct.role] || ""}>
                      {acct.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{acct.email}</p>
                </div>
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
    </div>
  );
};

export default RegisteredAccountsList;
