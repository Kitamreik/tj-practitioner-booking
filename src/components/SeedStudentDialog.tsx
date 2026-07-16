import { useState } from "react";
import { UserPlus, Copy, RefreshCw, Check, KeyRound } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  generatePassword,
  upsertAccount,
  findAccount,
  type LocalAccount,
} from "@/lib/accountUtils";

interface Props {
  onSeeded?: (account: LocalAccount) => void;
}

const SeedStudentDialog = ({ onSeeded }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => generatePassword());
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setPassword(generatePassword());
    setSaved(false);
    setCopied(false);
  };

  const regenerate = () => setPassword(generatePassword());

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Unable to copy — select and copy manually.");
    }
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!emailValid) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (findAccount(email.trim())) {
      toast.error("An account with that email already exists.");
      return;
    }
    const account: LocalAccount = {
      email: email.trim(),
      name: name.trim(),
      role: "fellow",
      signedIn: false,
      createdAt: new Date().toISOString(),
      password,
      passwordUpdatedAt: new Date().toISOString(),
    };
    upsertAccount(account);
    onSeeded?.(account);
    setSaved(true);
    toast.success(`Student account created for ${account.email}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <KeyRound className="h-4 w-4" /> Seed Student Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Seed a new student account</DialogTitle>
        </DialogHeader>

        {!saved ? (
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@school.edu"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Generated password</label>
              <div className="flex gap-2">
                <Input
                  value={password}
                  readOnly
                  className="font-mono"
                  aria-label="Generated password"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={regenerate}
                  aria-label="Regenerate password"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyPassword}
                  aria-label="Copy password"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this with the student. They can change it after signing in.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="gap-2">
                <UserPlus className="h-4 w-4" /> Create account
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="text-sm">
                Account created for <strong>{name}</strong>.
              </p>
              <div className="flex items-center gap-2 rounded-md border bg-background p-2">
                <span className="flex-1 truncate font-mono text-sm">{password}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyPassword}
                  className="gap-1"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy the password now — it will not be shown again in this dialog.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SeedStudentDialog;
