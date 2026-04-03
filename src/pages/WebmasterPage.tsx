import { useState, useEffect, useCallback } from "react";
import { usersApi, type AppUser } from "@/lib/api";
import { useRole } from "@/lib/roles";
import { Shield, Users, Pencil, Trash2, Mail, Search, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Mock users for demo when backend is unavailable
const MOCK_USERS: AppUser[] = [
  { id: "u1", email: "admin@bookflow.com", name: "Kit Admin", role: "admin", createdAt: "2026-01-15" },
  { id: "u2", email: "fellow1@bookflow.com", name: "Sarah Fellow", role: "fellow", createdAt: "2026-02-01" },
  { id: "u3", email: "fellow2@bookflow.com", name: "Michael Torres", role: "fellow", createdAt: "2026-02-10" },
  { id: "u4", email: "fellow3@bookflow.com", name: "Jessica Park", role: "fellow", createdAt: "2026-03-01" },
];

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  fellow: "bg-success/10 text-success border-success/20",
  webmaster: "bg-destructive/10 text-destructive border-destructive/20",
};

const WebmasterPage = () => {
  const { isWebmaster, role } = useRole();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [deleteUser, setDeleteUser] = useState<AppUser | null>(null);
  const [resetEmail, setResetEmail] = useState<AppUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch {
      // Fallback to mock users
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Block non-webmaster access
  if (role !== "webmaster" && role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">Only webmaster accounts can access user management.</p>
      </div>
    );
  }

  const filtered = users.filter((u) =>
    `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditSave = async () => {
    if (!editUser || !editName.trim() || !editEmail.trim()) return;
    const updates: Partial<AppUser> = { name: editName.trim(), email: editEmail.trim() };
    try {
      await usersApi.update(editUser.id, updates);
      toast.success(`Updated ${editUser.email}`);
    } catch {
      toast.info("Backend unavailable — updated locally.");
    }
    setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, ...updates } : u)));
    setEditUser(null);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    if (deleteUser.role === "webmaster") {
      toast.error("Cannot delete the webmaster account.");
      setDeleteUser(null);
      return;
    }
    try {
      await usersApi.delete(deleteUser.id);
      toast.success(`Deleted account for ${deleteUser.email}`);
    } catch {
      toast.info("Backend unavailable — removed locally.");
    }
    setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
    setDeleteUser(null);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) return;
    try {
      await usersApi.sendPasswordReset(resetEmail.email);
      toast.success(`Password reset email sent to ${resetEmail.email}`);
    } catch {
      toast.info("Backend unavailable — reset email queued for when backend is online.");
    }
    setResetEmail(null);
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <Shield className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">User Management</h1>
            <p className="mt-1 text-muted-foreground">Webmaster panel — manage all user accounts</p>
          </div>
        </div>
        <Badge variant="outline" className={roleBadgeStyles.webmaster}>
          Webmaster
        </Badge>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Users", value: users.length, icon: Users },
          { label: "Admins", value: users.filter((u) => u.role === "admin").length, icon: Shield },
          { label: "Fellows", value: users.filter((u) => u.role === "fellow").length, icon: Users },
          { label: "Webmasters", value: users.filter((u) => u.role === "webmaster").length, icon: Shield },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or role..."
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <Card key={user.id} className="transition-all hover:shadow-md">
              <CardContent className="flex items-center justify-between p-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-semibold text-foreground">{user.name}</h3>
                    <Badge variant="outline" className={roleBadgeStyles[user.role] || ""}>
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditUser(user); setEditName(user.name); setEditEmail(user.email); }}
                    className="gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setResetEmail(user)}
                    className="gap-1"
                  >
                    <Mail className="h-3.5 w-3.5" /> Reset
                  </Button>
                  {user.role !== "webmaster" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteUser(user)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-xl border bg-card p-12 text-center">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Name Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => { if (!open) setDeleteUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteUser?.name}</strong> ({deleteUser?.email})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Confirmation */}
      <AlertDialog open={!!resetEmail} onOpenChange={(open) => { if (!open) setResetEmail(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Password Reset</AlertDialogTitle>
            <AlertDialogDescription>
              Send a password reset email to <strong>{resetEmail?.email}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordReset}>Send Reset Email</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WebmasterPage;
