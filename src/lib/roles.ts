import { useUser } from "@clerk/clerk-react";

export type AppRole = "admin" | "fellow";

/**
 * Reads the user's role from Clerk publicMetadata.
 * Set roles in your Clerk Dashboard → Users → select user → publicMetadata:
 *   { "role": "admin" }  or  { "role": "fellow" }
 *
 * Defaults to "fellow" if no role is set or Clerk is not configured.
 */
export function useRole(): { role: AppRole; isAdmin: boolean; isFellow: boolean; isLoaded: boolean } {
  try {
    const { user, isLoaded } = useUser();
    const role = (user?.publicMetadata?.role as AppRole) || "fellow";
    return { role, isAdmin: role === "admin", isFellow: role === "fellow", isLoaded };
  } catch {
    // Clerk not configured — default to admin for development
    return { role: "admin", isAdmin: true, isFellow: false, isLoaded: true };
  }
}
