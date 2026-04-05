import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/lib/roles";
import { useBookings } from "@/hooks/useBookings";
import { User, Mail, Shield, Calendar, Clock, Loader2 } from "lucide-react";

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  fellow: "bg-accent/80 text-accent-foreground border-accent",
  webmaster: "bg-destructive/10 text-destructive border-destructive/20",
};

const ProfilePage = () => {
  const { role, isLoaded } = useRole();
  const { data: bookings = [], isLoading } = useBookings();
  const [user, setUser] = useState({ name: "Student", email: "" });

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("local-auth") || "{}");
    if (local.name) setUser({ name: local.name, email: local.email || "" });
  }, []);

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
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> My Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
