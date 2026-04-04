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
    if (user) {
      const role = (user?.publicMetadata?.role as AppRole) || "fellow";
      return { role, isAdmin: role === "admin", isFellow: role === "fellow", isWebmaster: role === "webmaster", isLoaded };
    }
    // Check local-auth fallback
    const local = JSON.parse(localStorage.getItem("local-auth") || "{}");
    if (local.signedIn && local.role) {
      const role = local.role as AppRole;
      return { role, isAdmin: role === "admin", isFellow: role === "fellow", isWebmaster: role === "webmaster", isLoaded: true };
    }
    return { role: "fellow", isAdmin: false, isFellow: true, isWebmaster: false, isLoaded };
  } catch {
    // Clerk not configured — check local-auth
    const local = JSON.parse(localStorage.getItem("local-auth") || "{}");
    if (local.signedIn && local.role) {
      const role = local.role as AppRole;
      return { role, isAdmin: role === "admin", isFellow: role === "fellow", isWebmaster: role === "webmaster", isLoaded: true };
    }
    return { role: "admin", isAdmin: true, isFellow: false, isWebmaster: false, isLoaded: true };
  }
}
