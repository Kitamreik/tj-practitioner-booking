import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api";
import { mockBookings, type Booking } from "@/lib/mockData";
import { toast } from "sonner";

// Auth token - in production this would come from Clerk or your auth provider
// For now we attempt the real API and fall back to mock data
function useAuthToken(): string | undefined {
  // Placeholder: integrate with your auth provider to get JWT token
  return undefined;
}

export function useBookings() {
  const token = useAuthToken();

  return useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      try {
        const data = await bookingsApi.getAll(token);
        return data;
      } catch (error) {
        console.warn("Backend unavailable, using mock data:", error);
        return mockBookings;
      }
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  const token = useAuthToken();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await bookingsApi.delete(id, token);
      } catch (error) {
        console.warn("Delete via API failed, removing locally:", error);
        // Optimistic removal from cache
        queryClient.setQueryData<Booking[]>(["bookings"], (old) =>
          old ? old.filter((b) => b.id !== id) : []
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete booking");
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const token = useAuthToken();

  return useMutation({
    mutationFn: (data: Partial<Booking>) => bookingsApi.create(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking created successfully");
    },
    onError: () => {
      toast.error("Failed to create booking");
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  const token = useAuthToken();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Booking> }) =>
      bookingsApi.update(id, data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking updated successfully");
    },
    onError: () => {
      toast.error("Failed to update booking");
    },
  });
}
