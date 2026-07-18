import { test, expect } from "../playwright-fixture";

/**
 * Verifies that password-reveal and change-password controls in the
 * webmaster panel's Registered Accounts list:
 *   - Only appear for the webmaster role.
 *   - Are hidden for admin and fellow roles.
 *   - Are hidden for external-auth accounts (no local password).
 *   - Require confirmation before revealing and auto-mask after a timeout.
 */

const BASE = "http://localhost:8080";

type LocalAuth = {
  email: string;
  name: string;
  role: "webmaster" | "admin" | "fellow";
  signedIn: true;
  passwordVersion?: number;
};

const LOCAL_ACCT = {
  email: "local-student@example.com",
  name: "Local Student",
  role: "fellow" as const,
  signedIn: false,
  createdAt: new Date().toISOString(),
  password: "TempPass123!",
  passwordVersion: 1,
};

const EXTERNAL_ACCT = {
  email: "google-student@example.com",
  name: "External Student",
  role: "fellow" as const,
  signedIn: false,
  createdAt: new Date().toISOString(),
  // No password field — represents an external-auth account.
};

async function seed(page: import("@playwright/test").Page, auth: LocalAuth) {
  await page.goto(BASE);
  await page.evaluate(
    ({ auth, accounts }) => {
      localStorage.setItem("local-auth", JSON.stringify(auth));
      localStorage.setItem("registered_accounts", JSON.stringify(accounts));
    },
    { auth, accounts: [LOCAL_ACCT, EXTERNAL_ACCT] }
  );
}

test.describe("Password reveal / change access control", () => {
  test("webmaster sees reveal + change controls only for local accounts", async ({ page }) => {
    await seed(page, {
      email: "web@bookflow.demo",
      name: "Web Master",
      role: "webmaster",
      signedIn: true,
    });
    await page.goto(`${BASE}/webmaster`);

    const localCard = page.getByTestId(`account-${LOCAL_ACCT.email}`);
    const extCard = page.getByTestId(`account-${EXTERNAL_ACCT.email}`);

    await expect(localCard.getByTestId(`toggle-password-${LOCAL_ACCT.email}`)).toBeVisible();
    await expect(localCard.getByTestId(`change-password-${LOCAL_ACCT.email}`)).toBeVisible();

    // External-auth account: no reveal / change controls, and the
    // "External auth" badge is shown.
    await expect(extCard.getByTestId(`toggle-password-${EXTERNAL_ACCT.email}`)).toHaveCount(0);
    await expect(extCard.getByTestId(`change-password-${EXTERNAL_ACCT.email}`)).toHaveCount(0);
    await expect(extCard.getByText("External auth")).toBeVisible();
  });

  test("admin cannot see reveal or change-password controls", async ({ page }) => {
    await seed(page, {
      email: "admin@bookflow.demo",
      name: "Demo Admin",
      role: "admin",
      signedIn: true,
    });
    await page.goto(`${BASE}/webmaster`);

    // Admins are allowed on the page but must not see either control for
    // the local account.
    await expect(page.getByTestId(`toggle-password-${LOCAL_ACCT.email}`)).toHaveCount(0);
    await expect(page.getByTestId(`change-password-${LOCAL_ACCT.email}`)).toHaveCount(0);
  });

  test("fellow is redirected away from /webmaster entirely", async ({ page }) => {
    await seed(page, {
      email: "student@bookflow.demo",
      name: "Demo Student",
      role: "fellow",
      signedIn: true,
    });
    await page.goto(`${BASE}/webmaster`);
    await expect(page).not.toHaveURL(/\/webmaster$/);
    // And the controls are not in the DOM anywhere.
    await expect(page.getByTestId(`toggle-password-${LOCAL_ACCT.email}`)).toHaveCount(0);
    await expect(page.getByTestId(`change-password-${LOCAL_ACCT.email}`)).toHaveCount(0);
  });

  test("reveal requires confirmation and auto-masks after timeout", async ({ page }) => {
    await seed(page, {
      email: "web@bookflow.demo",
      name: "Web Master",
      role: "webmaster",
      signedIn: true,
    });
    await page.goto(`${BASE}/webmaster`);

    const value = page.getByTestId(`password-value-${LOCAL_ACCT.email}`);
    await expect(value).toHaveText("••••••••••");

    await page.getByTestId(`toggle-password-${LOCAL_ACCT.email}`).click();

    // Confirmation dialog appears; clicking Cancel keeps the value masked.
    const confirm = page.getByTestId("reveal-confirm-dialog");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Cancel" }).click();
    await expect(value).toHaveText("••••••••••");

    // Confirm reveal — password is now visible with a countdown label.
    await page.getByTestId(`toggle-password-${LOCAL_ACCT.email}`).click();
    await page.getByTestId("confirm-reveal-btn").click();
    await expect(value).toHaveText(LOCAL_ACCT.password);
    await expect(page.getByTestId(`reveal-countdown-${LOCAL_ACCT.email}`)).toBeVisible();

    // Auto-mask after the 15s timeout. Give a small buffer for the interval.
    await expect(value).toHaveText("••••••••••", { timeout: 20_000 });
  });
});
