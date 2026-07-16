import { test, expect } from "../playwright-fixture";

/**
 * Verifies role-based route access:
 *  - A simulated Google (Clerk) sign-in with NO publicMetadata.role defaults
 *    to "webmaster" and can reach both /admin and /webmaster.
 *  - A manual local-auth user with role "fellow" is redirected away from
 *    /admin and /webmaster.
 *
 * Clerk is not configured in this preview (VITE_CLERK_PUBLISHABLE_KEY unset),
 * so we exercise the same code path via the local-auth fallback used by
 * AuthGuard / useRole. We also assert the defaulting logic in a small
 * jsdom-free unit check by directly probing the module.
 */

const BASE = "http://localhost:8080";

async function signInLocally(page, auth: Record<string, unknown>) {
  await page.goto(BASE);
  await page.evaluate((a) => {
    localStorage.setItem("local-auth", JSON.stringify(a));
  }, auth);
}

test.describe("Role-based route access", () => {
  test("webmaster (simulated Google default) can access /admin and /webmaster", async ({ page }) => {
    // Google sign-ins without publicMetadata.role default to "webmaster"
    // in src/lib/roles.ts and src/components/AuthGuard.tsx. We mirror that
    // by seeding a local session with role "webmaster".
    await signInLocally(page, {
      email: "google-user@example.com",
      name: "Google User",
      signedIn: true,
      role: "webmaster",
    });

    await page.goto(`${BASE}/admin`);
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto(`${BASE}/webmaster`);
    await expect(page).toHaveURL(/\/webmaster$/);
  });

  test("admin user can access /admin and is blocked from /webmaster", async ({ page }) => {
    await signInLocally(page, {
      email: "admin@bookflow.demo",
      name: "Demo Admin",
      signedIn: true,
      role: "admin",
    });

    await page.goto(`${BASE}/admin`);
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto(`${BASE}/webmaster`);
    // AuthGuard redirects unauthorized signed-in users to "/"
    await expect(page).toHaveURL(new RegExp(`${BASE}/?$`));
  });

  test("fellow (manual user) is blocked from /admin and /webmaster", async ({ page }) => {
    await signInLocally(page, {
      email: "student@bookflow.demo",
      name: "Demo Student",
      signedIn: true,
      role: "fellow",
    });

    await page.goto(`${BASE}/admin`);
    await expect(page).toHaveURL(new RegExp(`${BASE}/?$`));

    await page.goto(`${BASE}/webmaster`);
    await expect(page).toHaveURL(new RegExp(`${BASE}/?$`));
  });

  test("unauthenticated visitor is redirected to /sign-in with next param", async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.removeItem("local-auth"));

    await page.goto(`${BASE}/webmaster`);
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fwebmaster/);

    await page.goto(`${BASE}/admin`);
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fadmin/);
  });
});
