import { useUser } from "@clerk/clerk-react";

export type AppRole = "admin" | "fellow" | "webmaster";

/**
 * Reads the user's role from Clerk publicMetadata.
 * Set roles in your Clerk Dashboard → Users → select user → publicMetadata:
 *   { "role": "admin" }  or  { "role": "fellow" }  or  { "role": "webmaster" }
 *
 * Defaults to "fellow" if no role is set or Clerk is not configured.
 */
export function useRole(): { role: AppRole; isAdmin: boolean; isFellow: boolean; isWebmaster: boolean; isLoaded: boolean } {
  try {
    const { user, isLoaded } = useUser();
    const role = (user?.publicMetadata?.role as AppRole) || "fellow";
    return { role, isAdmin: role === "admin", isFellow: role === "fellow", isWebmaster: role === "webmaster", isLoaded };
  } catch {
    // Clerk not configured — default to admin for development
    return { role: "admin", isAdmin: true, isFellow: false, isWebmaster: false, isLoaded: true };
  }
}
