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
  "Organizational Systems Work",
  "Panels and Talks",
  "Remote & In- Person Conferences",
  "Workshops",
  "One-on-One Consulting",
  "Short Term/Long Term Retainer"
];

const practitioners = [
  "Kit A. (they/she)",
  "Tree Y. (she/they)",
  "Cori F. (she/her)",
  "Timothy C. (he/him)",
  "Ray V. (he/him)"
];

interface EditBookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormErrors {
  customerName?: string;
  service?: string;
  bookingTime?: string;
}

const EditBookingDialog = ({ booking, open, onOpenChange }: EditBookingDialogProps) => {
  const [customerName, setCustomerName] = useState("");
  const [service, setService] = useState("");
  const [practitioner, setPractitioner] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [status, setStatus] = useState<string>("pending");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  useEffect(() => {
    if (booking) {
      setCustomerName(booking.customer_name);
      setService(booking.service);
      setPractitioner(booking.practitioner || "");
      setStatus(booking.status);
      setDuration(String(booking.duration || 60));
      const dt = new Date(booking.booking_time);
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setBookingTime(local);
      setConfirmDelete(false);
      setErrors({});
    }
  }, [booking]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const trimmedName = customerName.trim();

    if (!trimmedName) {
      newErrors.customerName = "Customer name is required.";
    } else if (trimmedName.length < 2) {
      newErrors.customerName = "Name must be at least 2 characters.";
    } else if (trimmedName.length > 100) {
      newErrors.customerName = "Name must be under 100 characters.";
    } else if (!/^[a-zA-Z\s\-'.]+$/.test(trimmedName)) {
      newErrors.customerName = "Name contains invalid characters.";
    }

    if (!service) {
      newErrors.service = "Please select a service.";
    }

    if (!bookingTime) {
      newErrors.bookingTime = "Please select a date and time.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !validate()) return;

    updateBooking.mutate(
      {
        id: booking.id,
        data: {
          customer_name: customerName.trim(),
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
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="editCustomerName">Customer Name</Label>
            <Input
              id="editCustomerName"
              value={customerName}
              onChange={(e) => { setCustomerName(e.target.value); if (errors.customerName) setErrors((p) => ({ ...p, customerName: undefined })); }}
              maxLength={100}
              aria-invalid={!!errors.customerName}
            />
            {errors.customerName && <p className="text-xs text-destructive">{errors.customerName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="editService">Service</Label>
            <Select value={service} onValueChange={(v) => { setService(v); if (errors.service) setErrors((p) => ({ ...p, service: undefined })); }}>
              <SelectTrigger aria-invalid={!!errors.service}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service && <p className="text-xs text-destructive">{errors.service}</p>}
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
              onChange={(e) => { setBookingTime(e.target.value); if (errors.bookingTime) setErrors((p) => ({ ...p, bookingTime: undefined })); }}
              aria-invalid={!!errors.bookingTime}
            />
            {errors.bookingTime && <p className="text-xs text-destructive">{errors.bookingTime}</p>}
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
