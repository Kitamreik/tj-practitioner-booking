export interface Booking {
  id: string;
  customer_name: string;
  service: string;
  booking_time: string;
  status: "confirmed" | "pending" | "cancelled";
  created_at?: string;
  updated_at?: string;
  // Frontend-only enrichment fields (not in backend DB)
  practitioner?: string;
  duration?: number;
}

// Mock data used as fallback when backend is unavailable
export const mockBookings: Booking[] = [
  {
    id: "1",
    customer_name: "Sarah Johnson",
    service: "Deep Tissue Massage",
    booking_time: "2026-03-14T10:00:00",
    status: "confirmed",
    practitioner: "Dr. Emily Chen",
    duration: 60,
  },
  {
    id: "2",
    customer_name: "Michael Torres",
    service: "Acupuncture Session",
    booking_time: "2026-03-14T11:30:00",
    status: "pending",
    practitioner: "Dr. Wei Lin",
    duration: 45,
  },
  {
    id: "3",
    customer_name: "Jessica Park",
    service: "Physical Therapy",
    booking_time: "2026-03-14T14:00:00",
    status: "confirmed",
    practitioner: "Dr. Emily Chen",
    duration: 60,
  },
  {
    id: "4",
    customer_name: "David Kim",
    service: "Sports Recovery",
    booking_time: "2026-03-15T09:00:00",
    status: "cancelled",
    practitioner: "Dr. Alex Rivera",
    duration: 90,
  },
  {
    id: "5",
    customer_name: "Amanda Liu",
    service: "Wellness Consultation",
    booking_time: "2026-03-15T13:00:00",
    status: "confirmed",
    practitioner: "Dr. Wei Lin",
    duration: 30,
  },
  //pagination starts after 5 entries
  {
    id: "6",
    customer_name: "Carlos Mendez",
    service: "Deep Tissue Massage",
    booking_time: "2026-03-16T10:00:00",
    status: "pending",
    practitioner: "Dr. Emily Chen",
    duration: 60,
  },
  // {
  //   id: "7",
  //   customer_name: "Priya Sharma",
  //   service: "Acupuncture Session",
  //   booking_time: "2026-03-16T15:00:00",
  //   status: "confirmed",
  //   practitioner: "Dr. Wei Lin",
  //   duration: 45,
  // },
  // {
  //   id: "8",
  //   customer_name: "Ryan O'Brien",
  //   service: "Physical Therapy",
  //   booking_time: "2026-03-17T11:00:00",
  //   status: "confirmed",
  //   practitioner: "Dr. Alex Rivera",
  //   duration: 60,
  // },
];
