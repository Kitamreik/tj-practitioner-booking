import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle, ArrowRight } from "lucide-react";

const services = [
  "Organizational Systems Work",
  "Panels and Talks",
  "Remote & In- Person Conferences",
  "Workshops",
  "One-on-One Consulting",
  "Short Term/Long Term Retainer",
];

const practitioners = [
  "Kit A. (they/she)",
  "Tree Y. (she/they)",
  "Cori F. (she/her)",
  "Timothy C. (he/him)",
  "Ray V. (he/him)",
];

interface FormErrors {
  customerName?: string;
  service?: string;
  bookingTime?: string;
}

const ReservationsPage = () => {
  const [customerName, setCustomerName] = useState("");
  const [service, setService] = useState("");
  const [practitioner, setPractitioner] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const createBooking = useCreateBooking();

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const trimmedName = customerName.trim();

    if (!trimmedName) {
      newErrors.customerName = "Name is required.";
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
    } else {
      const selected = new Date(bookingTime);
      if (selected < new Date()) {
        newErrors.bookingTime = "Booking time must be in the future.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    createBooking.mutate(
      {
        customer_name: customerName.trim(),
        service,
        booking_time: new Date(bookingTime).toISOString(),
        status: "pending",
        practitioner: practitioner || undefined,
        duration: parseInt(duration) || 60,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
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
    setErrors({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Reservation Submitted!</h2>
            <p className="text-muted-foreground">
              Your booking request has been received. We'll confirm your appointment shortly.
            </p>
            <Button onClick={resetForm} variant="outline" className="mt-4">
              Book Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Make a Reservation</h1>
          <p className="mt-2 text-muted-foreground">Fill out the form below to request a booking</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>All fields marked are required to complete your reservation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="res-name">Your Name *</Label>
                <Input
                  id="res-name"
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); if (errors.customerName) setErrors((p) => ({ ...p, customerName: undefined })); }}
                  placeholder="e.g. Sarah Johnson"
                  maxLength={100}
                  aria-invalid={!!errors.customerName}
                />
                {errors.customerName && <p className="text-xs text-destructive">{errors.customerName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="res-service">Service *</Label>
                <Select value={service} onValueChange={(v) => { setService(v); if (errors.service) setErrors((p) => ({ ...p, service: undefined })); }}>
                  <SelectTrigger aria-invalid={!!errors.service}>
                    <SelectValue placeholder="Select a service" />
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
                <Label htmlFor="res-practitioner">Practitioner</Label>
                <Select value={practitioner} onValueChange={setPractitioner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a practitioner (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {practitioners.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="res-time">Date & Time *</Label>
                <Input
                  id="res-time"
                  type="datetime-local"
                  value={bookingTime}
                  onChange={(e) => { setBookingTime(e.target.value); if (errors.bookingTime) setErrors((p) => ({ ...p, bookingTime: undefined })); }}
                  min={new Date().toISOString().slice(0, 16)}
                  aria-invalid={!!errors.bookingTime}
                />
                {errors.bookingTime && <p className="text-xs text-destructive">{errors.bookingTime}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="res-duration">Duration</Label>
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
            <div className="mt-6">
              <Button type="submit" className="w-full gap-2" disabled={createBooking.isPending}>
                {createBooking.isPending ? "Submitting..." : "Submit Reservation"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReservationsPage;
