import { useState, useMemo } from "react";
import AdminBadge from "@/components/AdminBadge";
import BookingCard from "@/components/BookingCard";
import SearchBar from "@/components/SearchBar";
import PaginationControls from "@/components/PaginationControls";
import CreateBookingDialog from "@/components/CreateBookingDialog";
import EditBookingDialog from "@/components/EditBookingDialog";
import { useBookings } from "@/hooks/useBookings";
import { CalendarDays, Users, TrendingUp, Loader2 } from "lucide-react";
import type { Booking } from "@/lib/mockData";

const ITEMS_PER_PAGE = 5;

const AdminPage = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const { data: bookings = [], isLoading } = useBookings();

  const filtered = useMemo(() => {
    return bookings.filter((b) =>
      `${b.customer_name} ${b.service} ${b.practitioner || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, bookings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleEdit = (id: string) => {
    const b = bookings.find((x) => x.id === id);
    if (b) setEditBooking(b);
  };

  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;

  const dashStats = [
    { label: "Total Bookings", value: bookings.length, icon: CalendarDays },
    { label: "Confirmed", value: confirmed, icon: TrendingUp },
    { label: "Pending", value: pending, icon: Users },
  ];

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <AdminBadge />
          </div>
          <p className="mt-1 text-muted-foreground">Manage all bookings and practitioner schedules</p>
        </div>
        <CreateBookingDialog />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {dashStats.map((stat) => (
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

      <div className="mb-6">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setCurrentPage(1); }} placeholder="Search bookings..." />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.length > 0 ? (
            paginated.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                showActions
                onEdit={handleEdit}
              />
            ))
          ) : (
            <div className="rounded-xl border bg-card p-12 text-center">
              <p className="text-muted-foreground">No bookings found.</p>
            </div>
          )}
        </div>
      )}

      {filtered.length > ITEMS_PER_PAGE && (
        <div className="mt-6">
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      <EditBookingDialog
        booking={editBooking}
        open={!!editBooking}
        onOpenChange={(open) => { if (!open) setEditBooking(null); }}
      />
    </div>
  );
};

export default AdminPage;
