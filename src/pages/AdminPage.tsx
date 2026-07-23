import { useState, useMemo } from "react";
import AdminBadge from "@/components/AdminBadge";
import BookingCard from "@/components/BookingCard";
import SearchBar from "@/components/SearchBar";
import PaginationControls from "@/components/PaginationControls";
import CreateBookingDialog from "@/components/CreateBookingDialog";
import EditBookingDialog from "@/components/EditBookingDialog";
import ChecklistTracker from "@/components/ChecklistTracker";
import { useBookings, useDeleteBooking } from "@/hooks/useBookings";
import {
  CalendarDays,
  Users,
  TrendingUp,
  Loader2,
  Archive,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";
import type { Booking } from "@/lib/mockData";
import FileVault from "@/components/FileVault";
import AdminTestimonials from "@/components/AdminTestimonials";
import IntakeRecordsViewer from "@/components/IntakeRecordsViewer";
import ServicesManager from "@/components/ServicesManager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useResolvedCases, useResolvedIds, reopenCase } from "@/lib/resolvedCases";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 5;

const AdminPage = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { data: bookings = [], isLoading } = useBookings();
  const deleteMutation = useDeleteBooking();
  const resolvedIds = useResolvedIds();
  const resolvedCases = useResolvedCases();

  const activeBookings = useMemo(
    () => bookings.filter((b) => !resolvedIds.has(b.id)),
    [bookings, resolvedIds]
  );

  const filtered = useMemo(() => {
    return activeBookings.filter((b) =>
      `${b.customer_name} ${b.service} ${b.practitioner || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, activeBookings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleEdit = (id: string) => {
    const b = bookings.find((x) => x.id === id);
    if (b) setEditBooking(b);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteMutation.mutate(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      toast.info("Click delete again to confirm removal.");
    }
  };

  const confirmed = activeBookings.filter((b) => b.status === "confirmed").length;
  const pending = activeBookings.filter((b) => b.status === "pending").length;
  const cancelled = activeBookings.filter((b) => b.status === "cancelled").length;

  const dashStats = [
    { label: "Active Bookings", value: activeBookings.length, icon: CalendarDays, tone: "text-primary bg-primary/10" },
    { label: "Confirmed", value: confirmed, icon: CheckCircle2, tone: "text-success bg-success/10" },
    { label: "Pending", value: pending, icon: Clock, tone: "text-primary bg-primary/10" },
    { label: "Cancelled", value: cancelled, icon: XCircle, tone: "text-destructive bg-destructive/10" },
    { label: "Resolved", value: resolvedCases.length, icon: Archive, tone: "text-muted-foreground bg-muted" },
    { label: "Total", value: bookings.length, icon: TrendingUp, tone: "text-primary bg-primary/10" },
  ];

  const handleReopen = (id: string) => {
    const entry = reopenCase(id);
    if (entry) toast.success(`Case for ${entry.booking.customer_name} pushed back into the bookings queue`);
  };

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

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {dashStats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.tone}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="active" className="mb-8">
        <TabsList>
          <TabsTrigger value="active">
            <CalendarDays className="mr-1.5 h-4 w-4" />
            Active Bookings
            <Badge variant="secondary" className="ml-2">{activeBookings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archive">
            <Archive className="mr-1.5 h-4 w-4" />
            Archived Cases
            <Badge variant="secondary" className="ml-2">{resolvedCases.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
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
                    viewMode="admin"
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
        </TabsContent>

        <TabsContent value="archive" className="mt-4">
          {resolvedCases.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center">
              <Archive className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No resolved cases yet. Use "Close Case" on any booking to archive it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resolvedCases.map((rc) => (
                <Card key={rc.booking.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-base font-semibold text-foreground">
                            {rc.booking.service}
                          </h3>
                          <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                            Resolved
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rc.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          Closed {new Date(rc.resolvedAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => handleReopen(rc.booking.id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Review Case
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EditBookingDialog
        booking={editBooking}
        open={!!editBooking}
        onOpenChange={(open) => { if (!open) setEditBooking(null); }}
      />

      <ChecklistTracker bookings={activeBookings} />
      <IntakeRecordsViewer />
      <ServicesManager />
      <FileVault />
      <AdminTestimonials />
    </div>
  );
};

export default AdminPage;
