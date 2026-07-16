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

export function resetAccountPassword(email: string): string | null {
  const accounts = readAccounts();
  const idx = accounts.findIndex(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );
  if (idx === -1) return null;
  const pwd = generatePassword();
  accounts[idx] = {
    ...accounts[idx],
    password: pwd,
    passwordUpdatedAt: new Date().toISOString(),
  };
  writeAccounts(accounts);
  return pwd;
}

export function findAccount(email: string): LocalAccount | undefined {
  return readAccounts().find(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );
}
