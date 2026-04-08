import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logProfileEdit } from "@/components/ProfileEditLog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRole } from "@/lib/roles";
import { useBookings } from "@/hooks/useBookings";
import { User, Mail, Shield, Calendar, Clock, Loader2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  fellow: "bg-accent/80 text-accent-foreground border-accent",
  webmaster: "bg-destructive/10 text-destructive border-destructive/20",
};

const ProfilePage = () => {
  const { role, isLoaded } = useRole();
  const { data: bookings = [], isLoading } = useBookings();
  const [user, setUser] = useState({ name: "Student", email: "" });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("local-auth") || "{}");
    if (local.name) setUser({ name: local.name, email: local.email || "" });
  }, []);

  const startEdit = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setErrors({});
  };

  const saveEdit = () => {
    const newErrors: { name?: string; email?: string } = {};
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();

    if (!trimmedName || trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    } else if (trimmedName.length > 100) {
      newErrors.name = "Name must be less than 100 characters.";
    }

    if (!trimmedEmail) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Invalid email address.";
    } else if (trimmedEmail.length > 255) {
      newErrors.email = "Email must be less than 255 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update local-auth
    const local = JSON.parse(localStorage.getItem("local-auth") || "{}");
    local.name = trimmedName;
    local.email = trimmedEmail;
    localStorage.setItem("local-auth", JSON.stringify(local));

    // Update registered_accounts too
    const accounts = JSON.parse(localStorage.getItem("registered_accounts") || "[]");
    const idx = accounts.findIndex((a: { email: string }) => a.email === user.email);
    if (idx >= 0) {
      accounts[idx].name = trimmedName;
      accounts[idx].email = trimmedEmail;
      localStorage.setItem("registered_accounts", JSON.stringify(accounts));
    }

    // Log profile edits for webmaster
    if (trimmedName !== user.name) {
      logProfileEdit({ email: user.email, field: "name", oldValue: user.name, newValue: trimmedName });
    }
    if (trimmedEmail !== user.email) {
      logProfileEdit({ email: user.email, field: "email", oldValue: user.email, newValue: trimmedEmail });
    }

    setUser({ name: trimmedName, email: trimmedEmail });
    setEditing(false);
    toast.success("Profile updated successfully.");
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> My Profile
              </CardTitle>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={startEdit} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => { setEditName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                    maxLength={100}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => { setEditEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                    maxLength={255}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} className="gap-1">
                    <Check className="h-3.5 w-3.5" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit} className="gap-1">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-heading text-2xl font-bold text-foreground">{user.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {user.email || "No email set"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge variant="outline" className={roleBadgeStyles[role] || ""}>
                      {role}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Booking History
              <Badge variant="secondary">{bookings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 10).map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{b.service}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(b.booking_time).toLocaleDateString()}
                      <Badge
                        variant="outline"
                        className={
                          b.status === "confirmed"
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : b.status === "pending"
                            ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-600"
                            : "border-destructive/20 bg-destructive/10 text-destructive"
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
