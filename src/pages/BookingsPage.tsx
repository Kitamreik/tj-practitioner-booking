import { useState, useMemo } from "react";
import BookingCard from "@/components/BookingCard";
import SearchBar from "@/components/SearchBar";
import PaginationControls from "@/components/PaginationControls";
import CreateBookingDialog from "@/components/CreateBookingDialog";
import EditBookingDialog from "@/components/EditBookingDialog";
import { useBookings } from "@/hooks/useBookings";
import { Loader2, GraduationCap } from "lucide-react";
import type { Booking } from "@/lib/mockData";

const ITEMS_PER_PAGE = 5;

const BookingsPage = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const { data: bookings = [], isLoading } = useBookings();

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch = `${b.customer_name} ${b.service} ${b.practitioner || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, bookings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const statusOptions = ["all", "confirmed", "pending", "cancelled"];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Fellow Dashboard</h1>
            <p className="mt-1 text-muted-foreground">As a fellow, you can manage and edit scheduled sessions and appointments.</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar value={search} onChange={handleSearch} placeholder="Search by name, service, or practitioner..." />
        </div>
        <div className="flex gap-1 rounded-lg border bg-card p-1">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
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
                onEdit={(id) => {
                  const b = bookings.find((x) => x.id === id);
                  if (b) setEditBooking(b);
                }}
              />
            ))
          ) : (
            <div className="rounded-xl border bg-card p-12 text-center">
              <p className="text-muted-foreground">No bookings found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {filtered.length > ITEMS_PER_PAGE && (
        <div className="mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
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

export default BookingsPage;
