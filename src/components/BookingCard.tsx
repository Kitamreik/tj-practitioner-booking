import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User } from "lucide-react";
import type { Booking } from "@/lib/mockData";

interface BookingCardProps {
  booking: Booking;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

const statusStyles: Record<string, string> = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const BookingCard = ({ booking, onEdit, onDelete, showActions = false }: BookingCardProps) => {
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
        {/* {showActions && (
          <div className="mt-4 flex gap-2 border-t pt-3">
            <button
              onClick={() => onEdit?.(booking.id)}
              className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(booking.id)}
              className="rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              Delete
            </button>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
};

export default BookingCard;
