import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User, CheckCircle2 } from "lucide-react";
import type { Booking } from "@/lib/mockData";
import BookingChecklist from "@/components/BookingChecklist";
import BookingComments from "@/components/BookingComments";
import FellowFileVault from "@/components/FellowFileVault";
import ClientOnboardingNotes from "@/components/ClientOnboardingNotes";
import AdminStudentNotes from "@/components/AdminStudentNotes";
import BookingSignature from "@/components/BookingSignature";
import { resolveCase } from "@/lib/resolvedCases";
import { toast } from "sonner";

interface BookingCardProps {
  booking: Booking;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  /** "admin" shows delete on files, read-only comments add; "fellow" shows add on files, editable comments */
  viewMode?: "admin" | "fellow";
}

const statusStyles: Record<string, string> = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const BookingCard = ({ booking, onEdit, onDelete, showActions = false, viewMode }: BookingCardProps) => {
  const date = new Date(booking.booking_time);

  return (
    <Card className="group transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold text-foreground">
                {booking.service}
              </h3>
              <Badge variant="outline" className={statusStyles[booking.status]}>
                {booking.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {booking.customer_name}
              </span>
              {booking.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {booking.duration} min
                </span>
              )}
            </div>
            {booking.practitioner && (
              <p className="text-sm text-muted-foreground">
                with <span className="font-medium text-foreground">{booking.practitioner}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-heading text-sm font-semibold text-foreground">
              {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            <p className="text-sm text-muted-foreground">
              {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* 1. Client Onboarding Notes — admin-editable scenario seeds */}
        {viewMode && (
          <ClientOnboardingNotes
            bookingId={booking.id}
            service={booking.service}
            canEdit={viewMode === "admin"}
          />
        )}

        {/* 2. Comments (oldest → newest) */}
        {viewMode && <BookingComments bookingId={booking.id} canEdit={viewMode === "fellow" || viewMode === "admin"} />}

        {/* 3. Admin Notes */}
        {viewMode && (
          <AdminStudentNotes bookingId={booking.id} canEdit={viewMode === "admin"} />
        )}

        {/* 4. Signature (manual name entry, persisted locally) */}
        {viewMode && (
          <BookingSignature bookingId={booking.id} canEdit={viewMode === "fellow" || viewMode === "admin"} />
        )}

        {showActions && (
          <div className="mt-4 flex gap-2 border-t pt-3">
            <button
              onClick={() => onEdit?.(booking.id)}
              className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Edit
            </button>
          </div>
        )}
        {showActions && (
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <BookingChecklist bookingId={booking.id} />
            </div>
            {(viewMode === "admin" || viewMode === "fellow") && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5 border-success/30 text-success hover:bg-success/10 hover:text-success"
                onClick={() => {
                  resolveCase(booking);
                  toast.success(`Case for ${booking.customer_name} closed and sent to Resolved Cases`);
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Close Case
              </Button>
            )}
          </div>
        )}

        {/* Fellow File Vault */}
        {viewMode && (
          <FellowFileVault
            bookingId={booking.id}
            canAdd={viewMode === "fellow"}
            canDelete={viewMode === "admin"}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BookingCard;
