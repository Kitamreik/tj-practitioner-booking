// Utilities for locally-registered accounts (webmaster-seeded students, demo signups).
// Stored under localStorage key "registered_accounts".

export interface LocalAccount {
  email: string;
  name: string;
  role: "admin" | "fellow" | "webmaster";
  signedIn: boolean;
  createdAt: string;
  password?: string;
  passwordUpdatedAt?: string;
  mustResetPassword?: boolean;
  /**
   * Monotonic counter bumped every time the password changes (webmaster
   * reset or user-chosen). Any active session that was minted before this
   * value is considered invalidated — the sign-in flow records the
   * version it authenticated against, and the gate signs out mismatches.
   */
  passwordVersion?: number;
}

export const ACCOUNTS_KEY = "registered_accounts";
export const ACCOUNTS_EVENT = "registered-accounts:changed";

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

export function generatePassword(length = 14): string {
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[arr[i] % ALPHABET.length];
  }
  return out;
}

export function readAccounts(): LocalAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function writeAccounts(accounts: LocalAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new CustomEvent(ACCOUNTS_EVENT));
}

export function upsertAccount(account: LocalAccount): LocalAccount[] {
  const existing = readAccounts();
  const filtered = existing.filter(
    (a) => a.email.toLowerCase() !== account.email.toLowerCase()
  );
  const next = [account, ...filtered];
  writeAccounts(next);
  return next;
}

/**
 * Invalidate any currently active local-auth session for the given email.
 * Called after a webmaster reset so the previously-issued temporary
 * password (and any session it minted) can no longer be used from this
 * browser. Cross-browser invalidation happens on next sign-in via the
 * passwordVersion check.
 */
function invalidateActiveSession(email: string): void {
  try {
    const raw = localStorage.getItem("local-auth");
    if (!raw) return;
    const auth = JSON.parse(raw);
    if (
      auth?.email &&
      typeof auth.email === "string" &&
      auth.email.toLowerCase() === email.toLowerCase()
    ) {
      localStorage.removeItem("local-auth");
    }
  } catch {
    // ignore
  }
}

export function resetAccountPassword(email: string): string | null {
  const accounts = readAccounts();
  const idx = accounts.findIndex(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );
  if (idx === -1) return null;
  const pwd = generatePassword();
  const prevVersion = accounts[idx].passwordVersion ?? 0;
  accounts[idx] = {
    ...accounts[idx],
    password: pwd,
    passwordUpdatedAt: new Date().toISOString(),
    mustResetPassword: true,
    passwordVersion: prevVersion + 1,
  };
  writeAccounts(accounts);
  invalidateActiveSession(accounts[idx].email);
  return pwd;
}

export function setAccountPassword(email: string, newPassword: string): boolean {
  const accounts = readAccounts();
  const idx = accounts.findIndex(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );
  if (idx === -1) return false;
  const prevVersion = accounts[idx].passwordVersion ?? 0;
  const nextVersion = prevVersion + 1;
  accounts[idx] = {
    ...accounts[idx],
    password: newPassword,
    passwordUpdatedAt: new Date().toISOString(),
    mustResetPassword: false,
    passwordVersion: nextVersion,
  };
  writeAccounts(accounts);
  // Keep the current session (the user is setting their own password),
  // but roll the recorded version forward so the gate stays satisfied.
  try {
    const raw = localStorage.getItem("local-auth");
    if (raw) {
      const auth = JSON.parse(raw);
      if (
        auth?.email &&
        typeof auth.email === "string" &&
        auth.email.toLowerCase() === email.toLowerCase()
      ) {
        localStorage.setItem(
          "local-auth",
          JSON.stringify({ ...auth, passwordVersion: nextVersion })
        );
      }
    }
  } catch {
    // ignore
  }
  return true;
}

export function findAccount(email: string): LocalAccount | undefined {
  return readAccounts().find(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );
}
