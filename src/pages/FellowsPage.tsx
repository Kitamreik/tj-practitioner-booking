import { useState, useMemo } from "react";
import BookingCard from "@/components/BookingCard";
import SearchBar from "@/components/SearchBar";
import PaginationControls from "@/components/PaginationControls";
import { useBookings } from "@/hooks/useBookings";
import { Loader2, GraduationCap } from "lucide-react";

const ITEMS_PER_PAGE = 5;

const FellowsPage = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Fellow Dashboard</h1>
            <p className="mt-1 text-muted-foreground">View your scheduled sessions and appointments</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <SearchBar
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Search bookings..."
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.length > 0 ? (
            paginated.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
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
    </div>
  );
};

export default FellowsPage;
