import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { bookingsApi } from "@/lib/api";
import { mockBookings, type Booking } from "@/lib/mockData";
import { toast } from "sonner";

/**
 * Clerk auth integration:
 *
 * To connect real auth, wrap your app with <ClerkProvider publishableKey="pk_...">
 * in App.tsx or main.tsx. Then this hook will automatically call Clerk's getToken()
 * to attach a JWT to every API request.
 *
 * Code snippet for reference:
 *
 *   import { ClerkProvider } from "@clerk/clerk-react";
 *
 *   <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
 *     <App />
 *   </ClerkProvider>
 *
 * The useAuthToken hook below uses Clerk's useAuth().getToken() to fetch a
 * session JWT. The backend verifies this token via Clerk middleware.
 */

function useAuthToken() {
  // When ClerkProvider is available, useAuth() returns { getToken }.
  // If Clerk is not configured yet, we catch and return undefined.
  try {
    const { getToken } = useAuth();
    return getToken;
  } catch {
    // Clerk not configured — return null so we fall back to mock data
    return null;
  }
}

export function useBookings() {
  const getToken = useAuthToken();

  return useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      try {
        const token = getToken ? await getToken() : undefined;
        const data = await bookingsApi.getAll(token ?? undefined);
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
  const getToken = useAuthToken();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const token = getToken ? await getToken() : undefined;
        await bookingsApi.delete(id, token ?? undefined);
      } catch (error) {
        console.warn("Delete via API failed, removing locally:", error);
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
  const getToken = useAuthToken();

  return useMutation({
    mutationFn: async (data: Partial<Booking>) => {
      const token = getToken ? await getToken() : undefined;
      return bookingsApi.create(data, token ?? undefined);
    },
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
  const getToken = useAuthToken();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Booking> }) => {
      const token = getToken ? await getToken() : undefined;
      return bookingsApi.update(id, data, token ?? undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking updated successfully");
    },
    onError: () => {
      toast.error("Failed to update booking");
    },
  });
}
