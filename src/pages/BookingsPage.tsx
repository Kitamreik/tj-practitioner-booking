import { useState, useMemo } from "react";
import BookingCard from "@/components/BookingCard";
import SearchBar from "@/components/SearchBar";
import PaginationControls from "@/components/PaginationControls";
import { mockBookings } from "@/lib/mockData";

const ITEMS_PER_PAGE = 5;

const BookingsPage = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return mockBookings.filter((b) => {
      const matchesSearch = `${b.customer_name} ${b.service} ${b.practitioner}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

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
        <h1 className="font-heading text-3xl font-bold text-foreground">Bookings</h1>
        <p className="mt-1 text-muted-foreground">View and manage all scheduled appointments</p>
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

      <div className="space-y-3">
        {paginated.length > 0 ? (
          paginated.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center">
            <p className="text-muted-foreground">No bookings found matching your criteria.</p>
          </div>
        )}
      </div>

      {filtered.length > ITEMS_PER_PAGE && (
        <div className="mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
