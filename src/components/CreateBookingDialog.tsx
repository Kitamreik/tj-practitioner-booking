import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useCreateBooking } from "@/hooks/useBookings";
import { Plus } from "lucide-react";

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

const CreateBookingDialog = () => {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [service, setService] = useState("");
  const [practitioner, setPractitioner] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [duration, setDuration] = useState("60");
  const createBooking = useCreateBooking();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !service || !bookingTime) return;

    createBooking.mutate(
      {
        customer_name: customerName,
        service,
        booking_time: new Date(bookingTime).toISOString(),
        status: "pending",
        practitioner: practitioner || undefined,
        duration: parseInt(duration) || 60,
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setCustomerName("");
    setService("");
    setPractitioner("");
    setBookingTime("");
    setDuration("60");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
          <DialogDescription>Fill in the details to schedule a new appointment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service</Label>
            <Select value={service} onValueChange={setService} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="practitioner">Practitioner</Label>
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
            <Label htmlFor="bookingTime">Date & Time</Label>
            <Input
              id="bookingTime"
              type="datetime-local"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBooking.isPending}>
              {createBooking.isPending ? "Creating..." : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBookingDialog;
