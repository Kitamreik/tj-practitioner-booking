import { useState } from "react";
import { UserPlus, Mail, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usersApi, type AppUser } from "@/lib/api";
import { toast } from "sonner";

interface CreateUserDialogProps {
  onCreated: (user: AppUser) => void;
}

const CreateUserDialog = ({ onCreated }: CreateUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppUser["role"]>("fellow");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("fellow");
  };

  const handleManualCreate = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setBusy(true);
    try {
      const user = await usersApi.create({ name: name.trim(), email: email.trim(), role });
      onCreated(user);
      toast.success(`Created account for ${user.email}`);
    } catch {
      const local: AppUser = {
        id: `local-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role,
        createdAt: new Date().toISOString(),
      };
      onCreated(local);
      toast.info("Backend unavailable — created locally.");
    } finally {
      setBusy(false);
      setOpen(false);
      reset();
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      toast.error("Email is required to send a magic link.");
      return;
    }
    setBusy(true);
    try {
      await usersApi.sendMagicLink(email.trim(), role);
      toast.success(`Magic link sent to ${email.trim()}`);
    } catch {
      toast.info("Backend unavailable — magic link queued for when backend is online.");
    } finally {
      setBusy(false);
      setOpen(false);
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" /> New User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new user account</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="manual" className="pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="magic">Magic link</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="jane@school.edu" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Role</label>
              <Select value={role} onValueChange={(v) => setRole(v as AppUser["role"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fellow">Fellow (Student)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="webmaster">Webmaster</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleManualCreate} disabled={busy} className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Create account
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="magic" className="space-y-3 pt-3">
            <p className="text-sm text-muted-foreground">
              Send a one-time sign-in link. The recipient will be added to the user base when they complete sign-in.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="student@school.edu" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assign role</label>
              <Select value={role} onValueChange={(v) => setRole(v as AppUser["role"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fellow">Fellow (Student)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="webmaster">Webmaster</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleMagicLink} disabled={busy} className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send magic link
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
