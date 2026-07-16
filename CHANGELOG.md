# Changelog

All notable changes to this project are documented in this file. Dates use
ISO-8601 (YYYY-MM-DD).

## [Unreleased]

### Security

- **Client-side authorization guards on privileged API endpoints.** The
  shared `apiFetch` helper (`src/lib/api.ts`) now blocks calls to admin- and
  webmaster-only routes when the active session role isn't permitted, and
  auto-attaches a Clerk JWT (via the new `AuthTokenBridge` component) plus
  advisory `X-User-Email` / `X-User-Role` headers on every request. All
  `usersApi.*` mutations and `adminStudentNotesApi.save` /
  `onboardingApi.saveAll` / `bookingsApi.delete` are marked `requiredRole:
  webmaster` or `admin|webmaster`, so a fellow (or an unauthenticated
  visitor) calling them directly from the console throws before any network
  request goes out.
  This is defense-in-depth only — the Render/Express backend is a separate
  repository and remains the source of truth for authorization. It is
  expected to verify the `Authorization: Bearer <jwt>` header against
  Clerk's JWKS and reject any request whose verified role/claim is not
  permitted for the endpoint. The frontend cannot enforce that on its own.
- **Sign Out available for every signed-in session.** The nav bar sign-out
  button previously only rendered for Clerk sessions, leaving local-auth
  admin/webmaster fallbacks with no way to end a session from the UI. The
  button now shows whenever either a Clerk or local-auth session is active
  and clears both — `clearAllSessionState()` wipes `local-auth` and the
  registered auth-token provider before `clerk.signOut()` runs, so an
  in-flight request can't race a stale session back into the app.



- **Upgraded `recharts` from `^2.15.4` to pinned `3.9.2`** to eliminate its
  transitive dependency on `lodash`, resolving three advisories surfaced by
  the dependency scanner:
  - Lodash Prototype Pollution in `_.unset` / `_.omit` (moderate).
  - Lodash Code Injection via `_.template` (high).
  - Lodash Prototype Pollution via array-path bypass in `_.unset` / `_.omit`
    (moderate).
  recharts v3 replaces its internal lodash usage with `es-toolkit`, so no
  vulnerable lodash version is pulled into the tree.
  The version is pinned (no caret) so future `bun install` runs cannot
  silently pick up a range update that reintroduces the risk. The only
  in-tree consumer is `src/components/ui/chart.tsx` (shadcn chart wrapper);
  no product page currently renders live charts, so the surface area of the
  upgrade is limited. Smoke-verified via Playwright against `/`, `/sign-in`,
  and `/webmaster` after upgrade.

- **Upgraded `react-router-dom` from `^6.30.1` to pinned `6.30.4`** to pick
  up the v6-line patches for:
  - XSS via open redirects in `@remix-run/router` (high).
  - Unexpected external redirect via untrusted paths (moderate).
  - Same-origin redirect with `//`-prefixed paths reinterpreted as
    protocol-relative URLs (moderate).
  Stayed on the v6 line to avoid the breaking API surface of v7. Also
  hardened the app-level `?next=` handling in `SignInPage` to reject any
  path starting with `//` before router redirects run.

- Converted the lockfile from binary `bun.lockb` to text `bun.lock`
  (`bun install --save-text-lockfile`) so the dependency scanner can
  verify future fixes without additional conversion steps.
