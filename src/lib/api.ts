import type { Booking } from "./mockData";

// Backend API base URL - your Render deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://kit-services-bp-be.onrender.com";

interface ApiOptions {
  token?: string;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, apiOptions: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (apiOptions.token) {
    headers.Authorization = `Bearer ${apiOptions.token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const bookingsApi = {
  getAll: (token?: string): Promise<Booking[]> =>
    apiFetch<Booking[]>("/api/bookings", {}, { token }),

  getById: (id: string, token?: string): Promise<Booking> =>
    apiFetch<Booking>(`/api/bookings/${id}`, {}, { token }),

  create: (data: Partial<Booking>, token?: string): Promise<Booking[]> =>
    apiFetch<Booking[]>("/api/bookings/create", { method: "POST", body: JSON.stringify(data) }, { token }),

  update: (id: string, data: Partial<Booking>, token?: string): Promise<Booking[]> =>
    apiFetch<Booking[]>(`/api/bookings/update/${id}`, { method: "PUT", body: JSON.stringify(data) }, { token }),

  delete: (id: string, token?: string): Promise<void> =>
    apiFetch<void>(`/api/bookings/delete/${id}`, { method: "DELETE" }, { token }),

  sendNotification: (bookingData: Partial<Booking>, token?: string): Promise<void> =>
    apiFetch<void>(
      "/api/bookings/notify",
      { method: "POST", body: JSON.stringify(bookingData) },
      { token }
    ),
};
