import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateBooking, useDeleteBooking } from "@/hooks/useBookings";
import type { Booking } from "@/lib/mockData";
import { Trash2 } from "lucide-react";

const services = [
  "Deep Tissue Massage",
  "Acupuncture Session",
  "Physical Therapy",
  "Sports Recovery",
  "Wellness Consultation",
];

const practitioners = [
  "Dr. Emily Chen",
  "Dr. Wei Lin",
  "Dr. Alex Rivera",
];

interface EditBookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditBookingDialog = ({ booking, open, onOpenChange }: EditBookingDialogProps) => {
  const [customerName, setCustomerName] = useState("");
  const [service, setService] = useState("");
  const [practitioner, setPractitioner] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [status, setStatus] = useState<string>("pending");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  useEffect(() => {
    if (booking) {
      setCustomerName(booking.customer_name);
      setService(booking.service);
      setPractitioner(booking.practitioner || "");
      setStatus(booking.status);
      setDuration(String(booking.duration || 60));
      // Format for datetime-local input
      const dt = new Date(booking.booking_time);
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setBookingTime(local);
      setConfirmDelete(false);
    }
  }, [booking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !customerName || !service || !bookingTime) return;

    updateBooking.mutate(
      {
        id: booking.id,
        data: {
          customer_name: customerName,
          service,
          booking_time: new Date(bookingTime).toISOString(),
          status: status as Booking["status"],
          practitioner: practitioner || undefined,
          duration: parseInt(duration) || 60,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const handleDelete = () => {
    if (!booking) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteBooking.mutate(booking.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>Update the booking details or delete it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editCustomerName">Customer Name</Label>
            <Input
              id="editCustomerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editService">Service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editPractitioner">Practitioner</Label>
            <Select value={practitioner} onValueChange={setPractitioner}>
              <SelectTrigger>
                <SelectValue placeholder="Select a practitioner" />
              </SelectTrigger>
              <SelectContent>
                {practitioners.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editBookingTime">Date & Time</Label>
            <Input
              id="editBookingTime"
              type="datetime-local"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editDuration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex !justify-between gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBooking.isPending}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? "Confirm Delete" : "Delete"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateBooking.isPending}>
                {updateBooking.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;
