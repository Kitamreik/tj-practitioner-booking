import { useUser } from "@clerk/clerk-react";

export type AppRole = "admin" | "fellow" | "webmaster";

/**
 * Reads the user's role from Clerk publicMetadata.
 * Set roles in your Clerk Dashboard → Users → select user → publicMetadata:
 *   { "role": "admin" }  or  { "role": "fellow" }  or  { "role": "webmaster" }
 *
 * Clerk-authenticated users (including Google OAuth sign-ins) default to
 * "webmaster" when no explicit role is set, so they can reach both the
 * admin and webmaster pages. Local-auth accounts keep their seeded role.
 */
export function useRole(): { role: AppRole; isAdmin: boolean; isFellow: boolean; isWebmaster: boolean; isLoaded: boolean } {
  const build = (role: AppRole, isLoaded: boolean) => ({
    role,
    isAdmin: role === "admin",
    isFellow: role === "fellow",
    isWebmaster: role === "webmaster",
    isLoaded,
  });

  try {
    const { user, isLoaded } = useUser();
    if (user) {
      const metaRole = user?.publicMetadata?.role as AppRole | undefined;
      // Google/Clerk users without an explicit role are treated as webmaster
      // so they can access both /admin and /webmaster.
      const role: AppRole = metaRole || "webmaster";
      return build(role, isLoaded);
    }
    // Check local-auth fallback
    const local = JSON.parse(localStorage.getItem("local-auth") || "{}");
    if (local.signedIn && local.role) {
      return build(local.role as AppRole, true);
    }
    return build("fellow", isLoaded);
  } catch {
    // Clerk not configured — check local-auth
    const local = JSON.parse(localStorage.getItem("local-auth") || "{}");
    if (local.signedIn && local.role) {
      return build(local.role as AppRole, true);
    }
    return build("admin", true);
  }
}
