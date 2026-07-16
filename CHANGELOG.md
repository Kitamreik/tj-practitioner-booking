# Changelog

All notable changes to this project are documented in this file. Dates use
ISO-8601 (YYYY-MM-DD).

## [Unreleased]

### Security

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
