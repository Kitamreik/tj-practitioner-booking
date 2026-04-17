import { useState, useMemo } from "react";
import BookingCard from "@/components/BookingCard";
import SearchBar from "@/components/SearchBar";
import PaginationControls from "@/components/PaginationControls";
import PullToRefresh from "@/components/PullToRefresh";
import { useBookings } from "@/hooks/useBookings";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 5;

const FellowsPage = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { data: bookings = [], isLoading } = useBookings();
  const queryClient = useQueryClient();
  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ["bookings"] });

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
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Bookings</h1>
            <p className="mt-1 text-muted-foreground">View all scheduled appointments practitioners are managing.</p>
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
                <BookingCard key={booking.id} booking={booking} viewMode="fellow" />
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
    </PullToRefresh>
  );
};

export default FellowsPage;
