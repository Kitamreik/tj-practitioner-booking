import type { Booking } from "./mockData";

// Backend API base URL - your Render deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://kit-services-bp-be.onrender.com";

export type SessionRole = "admin" | "fellow" | "webmaster";

/**
 * ---------------------------------------------------------------------------
 * Auth token bridge
 * ---------------------------------------------------------------------------
 * A Clerk-aware component (see `AuthTokenBridge` in App.tsx) registers a
 * `getToken()` function here at startup. Every privileged API call then
 * automatically attaches a fresh JWT — callers don't have to remember to
 * pass one.
 *
 * The real authorization check MUST live on the backend (Render/Express),
 * which is a separate repository. The backend is expected to:
 *   1. Verify the `Authorization: Bearer <jwt>` with Clerk's JWKS.
 *   2. Reject the request if the verified role/claim is not permitted
 *      for the endpoint (admin/webmaster only for user-management + admin
 *      notes routes).
 *
 * The client-side `requiredRole` guard below is defense-in-depth: it stops
 * a signed-out or wrong-role session from even issuing the request. It is
 * NOT a substitute for server enforcement.
 */
let tokenProvider: (() => Promise<string | null>) | null = null;

export function registerAuthTokenProvider(fn: (() => Promise<string | null>) | null) {
  tokenProvider = fn;
}

interface LocalAuth {
  email?: string;
  role?: SessionRole;
  signedIn?: boolean;
}

function readLocalAuth(): LocalAuth {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("local-auth") || "{}");
  } catch {
    return {};
  }
}

function currentSessionRole(): SessionRole | null {
  const local = readLocalAuth();
  if (local.signedIn && local.role) return local.role;
  // Clerk-backed sessions: without a verified JWT we can't know the role
  // client-side. If a token provider is registered we treat the session as
  // authenticated and let the server enforce the role.
  if (tokenProvider) return null;
  return null;
}

interface ApiOptions {
  token?: string;
  /** Client-side pre-check. Requests are blocked locally if the current
   *  session role isn't in this list AND no Clerk token provider is present
   *  to defer authorization to the backend. */
  requiredRole?: SessionRole[];
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  apiOptions: ApiOptions = {}
): Promise<T> {
  // Client-side defense-in-depth guard.
  if (apiOptions.requiredRole && apiOptions.requiredRole.length > 0) {
    const role = currentSessionRole();
    const hasClerkToken = !!tokenProvider;
    if (!role && !hasClerkToken) {
      throw new Error("Unauthorized: no active session for privileged request");
    }
    if (role && !apiOptions.requiredRole.includes(role)) {
      throw new Error(`Forbidden: role "${role}" not permitted for this endpoint`);
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Prefer explicit caller token, else fetch from the registered Clerk bridge.
  let token = apiOptions.token;
  if (!token && tokenProvider) {
    try {
      token = (await tokenProvider()) ?? undefined;
    } catch {
      token = undefined;
    }
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  // Forward local-auth identity so the backend can double-check for
  // demo/local sessions. The server must still verify these claims — they
  // are advisory hints, not authorization proof.
  const local = readLocalAuth();
  if (local.signedIn && local.email) headers["X-User-Email"] = local.email;
  if (local.signedIn && local.role) headers["X-User-Role"] = local.role;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    await handleAuthFailure(res.status);
    throw new Error(
      res.status === 401
        ? "Unauthorized: your session is invalid or expired"
        : "Forbidden: your account is not permitted to perform this action"
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/**
 * Global handler for 401/403 responses from privileged API calls.
 *
 * - 401 → the session is invalid/expired. Wipe local state and bounce to
 *   /sign-in with a `next` hint so the user can return after re-auth.
 * - 403 → the session is valid but the role is wrong. Keep the session but
 *   send the user back to the safe landing page.
 *
 * This is the client half of the defense — the Render/Express backend is
 * the source of truth and MUST enforce these checks itself.
 */
async function handleAuthFailure(status: 401 | 403 | number) {
  if (typeof window === "undefined") return;
  // Debounce: avoid a redirect storm when many queries fail at once.
  const now = Date.now();
  const last = Number(sessionStorage.getItem("__auth_failure_at") || 0);
  if (now - last < 1500) return;
  sessionStorage.setItem("__auth_failure_at", String(now));

  try {
    const { toast } = await import("sonner");
    if (status === 401) {
      toast.error("Your session has expired. Please sign in again.");
    } else {
      toast.error("You don't have permission to view this page.");
    }
  } catch {
    /* toast unavailable — fail silently */
  }

  if (status === 401) {
    clearAllSessionState();
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/sign-in?next=${next}`);
  } else if (status === 403) {
    window.location.replace("/");
  }
}

const ADMIN_OR_WEBMASTER: SessionRole[] = ["admin", "webmaster"];
const WEBMASTER_ONLY: SessionRole[] = ["webmaster"];
const ANY_SIGNED_IN: SessionRole[] = ["fellow", "admin", "webmaster"];

export const bookingsApi = {
  getAll: (token?: string): Promise<Booking[]> =>
    apiFetch<Booking[]>("/api/bookings/", {}, { token, requiredRole: ANY_SIGNED_IN }),

  getById: (id: string, token?: string): Promise<Booking> =>
    apiFetch<Booking>(`/api/bookings/${id}`, {}, { token, requiredRole: ANY_SIGNED_IN }),

  create: (data: Partial<Booking>, token?: string): Promise<Booking[]> =>
    apiFetch<Booking[]>(
      "/api/bookings/create",
      { method: "POST", body: JSON.stringify(data) },
      { token, requiredRole: ANY_SIGNED_IN }
    ),

  update: (id: string, data: Partial<Booking>, token?: string): Promise<Booking[]> =>
    apiFetch<Booking[]>(
      `/api/bookings/update/${id}`,
      { method: "PUT", body: JSON.stringify(data) },
      { token, requiredRole: ANY_SIGNED_IN }
    ),

  delete: (id: string, token?: string): Promise<void> =>
    apiFetch<void>(
      `/api/bookings/delete/${id}`,
      { method: "DELETE" },
      { token, requiredRole: ADMIN_OR_WEBMASTER }
    ),

  sendNotification: (bookingData: Partial<Booking>, token?: string): Promise<void> =>
    apiFetch<void>(
      "/api/bookings/notify",
      { method: "POST", body: JSON.stringify(bookingData) },
      { token, requiredRole: ANY_SIGNED_IN }
    ),
};


// --- File Vault API (per-booking files) ---
export interface BookingFile {
  id: string;
  name: string;
  type: "image" | "pdf" | "link";
  url: string;
  addedAt: string;
  bookingId: string;
}

export const filesApi = {
  getByBooking: (bookingId: string, token?: string): Promise<BookingFile[]> =>
    apiFetch<BookingFile[]>(`/api/files/${bookingId}`, {}, { token }),

  create: (data: Partial<BookingFile>, token?: string): Promise<BookingFile> =>
    apiFetch<BookingFile>("/api/files/create", { method: "POST", body: JSON.stringify(data) }, { token }),

  delete: (id: string, token?: string): Promise<void> =>
    apiFetch<void>(`/api/files/delete/${id}`, { method: "DELETE" }, { token }),
};

// --- Comments API (per-booking comments) ---
export interface BookingComment {
  id: string;
  text: string;
  author: string;
  bookingId: string;
  createdAt: string;
}

export const commentsApi = {
  getByBooking: (bookingId: string, token?: string): Promise<BookingComment[]> =>
    apiFetch<BookingComment[]>(`/api/comments/${bookingId}`, {}, { token }),

  create: (data: Partial<BookingComment>, token?: string): Promise<BookingComment> =>
    apiFetch<BookingComment>("/api/comments/create", { method: "POST", body: JSON.stringify(data) }, { token }),

  update: (id: string, data: Partial<BookingComment>, token?: string): Promise<BookingComment> =>
    apiFetch<BookingComment>(`/api/comments/update/${id}`, { method: "PUT", body: JSON.stringify(data) }, { token }),

  delete: (id: string, token?: string): Promise<void> =>
    apiFetch<void>(`/api/comments/delete/${id}`, { method: "DELETE" }, { token }),
};

// --- User Management API (webmaster only) ---
export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "fellow" | "webmaster";
  createdAt: string;
}

export const usersApi = {
  getAll: (token?: string): Promise<AppUser[]> =>
    apiFetch<AppUser[]>("/api/users/", {}, { token, requiredRole: WEBMASTER_ONLY }),

  update: (id: string, data: Partial<AppUser>, token?: string): Promise<AppUser> =>
    apiFetch<AppUser>(
      `/api/users/update/${id}`,
      { method: "PUT", body: JSON.stringify(data) },
      { token, requiredRole: WEBMASTER_ONLY }
    ),

  delete: (id: string, token?: string): Promise<void> =>
    apiFetch<void>(
      `/api/users/delete/${id}`,
      { method: "DELETE" },
      { token, requiredRole: WEBMASTER_ONLY }
    ),

  sendPasswordReset: (email: string, token?: string): Promise<void> =>
    apiFetch<void>(
      "/api/users/reset-password",
      { method: "POST", body: JSON.stringify({ email }) },
      { token, requiredRole: WEBMASTER_ONLY }
    ),

  create: (data: { name: string; email: string; role: AppUser["role"] }, token?: string): Promise<AppUser> =>
    apiFetch<AppUser>(
      "/api/users/create",
      { method: "POST", body: JSON.stringify(data) },
      { token, requiredRole: WEBMASTER_ONLY }
    ),

  sendMagicLink: (email: string, role: AppUser["role"], token?: string): Promise<void> =>
    apiFetch<void>(
      "/api/users/magic-link",
      { method: "POST", body: JSON.stringify({ email, role }) },
      { token, requiredRole: WEBMASTER_ONLY }
    ),
};

// --- Onboarding Notes API (per-booking onboarding scenarios) ---
export interface OnboardingNotePayload {
  id: string;
  bookingId: string;
  category: string;
  contentWarnings: string[];
  title: string;
  body: string;
  order: number;
  createdAt: string;
}

export const onboardingApi = {
  getByBooking: (bookingId: string, token?: string): Promise<OnboardingNotePayload[]> =>
    apiFetch<OnboardingNotePayload[]>(`/api/onboarding/${bookingId}`, {}, { token }),

  saveAll: (bookingId: string, notes: OnboardingNotePayload[], token?: string): Promise<void> =>
    apiFetch<void>(
      `/api/onboarding/${bookingId}`,
      { method: "PUT", body: JSON.stringify({ notes }) },
      { token, requiredRole: ADMIN_OR_WEBMASTER }
    ),
};

// --- Admin → Student notes (under checklist) ---
export const adminStudentNotesApi = {
  get: (bookingId: string, token?: string): Promise<{ text: string; updatedAt: string }> =>
    apiFetch(`/api/admin-notes/${bookingId}`, {}, { token }),

  save: (bookingId: string, text: string, token?: string): Promise<void> =>
    apiFetch(
      `/api/admin-notes/${bookingId}`,
      { method: "PUT", body: JSON.stringify({ text }) },
      { token, requiredRole: ADMIN_OR_WEBMASTER }
    ),
};

/**
 * Clears every trace of the current session from browser storage. Called
 * from the Sign Out button so that Clerk's `signOut()` alone is not the only
 * gate — local-auth fallbacks, cached tokens, and role hints are all wiped.
 */
export function clearAllSessionState() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("local-auth");
    // Legacy keys that different features have written over time.
    localStorage.removeItem("force-password-reset");
    // Clerk stores its own session under __clerk_* — those are cleared by
    // clerk.signOut(). We only remove keys we own.
    window.dispatchEvent(new Event("registered-accounts:changed"));
  } catch {
    /* ignore */
  }
  registerAuthTokenProvider(null);
}
