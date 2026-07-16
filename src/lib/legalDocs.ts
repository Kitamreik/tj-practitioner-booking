import { useEffect, useState } from "react";

/**
 * Legal documents registry.
 * Persisted locally (localStorage) with an audit log of all edits.
 * Content is stored as plain text (Markdown-lite) and rendered as text,
 * never as HTML, to prevent stored-XSS. See LegalPage for the renderer.
 */

export type LegalSlug =
  | "terms"
  | "privacy"
  | "cookies"
  | "retention"
  | "dpa"
  | "acceptable-use";

export interface LegalDoc {
  slug: LegalSlug;
  title: string;
  content: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

export interface LegalAuditEntry {
  slug: LegalSlug;
  editor: string;
  at: string;
  version: number;
  bytes: number;
}

const STORAGE_KEY = "kit_legal_docs_v1";
const AUDIT_KEY = "kit_legal_docs_audit_v1";
const REAUTH_ATTEMPTS_KEY = "kit_legal_reauth_attempts_v1";
const CHANGE_EVENT = "kit-legal-docs-changed";

// Max content size (defense-in-depth against localStorage abuse)
export const MAX_CONTENT_BYTES = 200_000;
export const MAX_TITLE_LEN = 120;

const DEFAULTS: LegalDoc[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    content: `# Terms of Service

Last updated: ${new Date().toLocaleDateString()}

These Terms of Service ("Terms") govern your access to and use of this booking platform ("Service"). By using the Service you agree to these Terms.

## 1. Eligibility & Accounts
You must be at least 18 years old, or the age of majority in your jurisdiction, to use the Service. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.

## 2. Acceptable Use
Use of the Service is subject to our Acceptable Use Policy. Prohibited activity includes attempting to breach security, scraping, or interfering with other users.

## 3. Bookings
Bookings are subject to practitioner availability. You are responsible for the accuracy of information you provide. Cancellation and rescheduling are handled per posted policies at the time of booking.

## 4. Intellectual Property
The Service, including its text, graphics, and software, is owned by the operator and its licensors. No license is granted except as expressly stated.

## 5. Disclaimer & Limitation of Liability
The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, the operator will not be liable for indirect, incidental, or consequential damages.

## 6. Termination
We may suspend or terminate your access if you breach these Terms or applicable law.

## 7. Changes
We may update these Terms. Continued use after changes constitutes acceptance.

## 8. Contact
Questions: contact the platform administrator.`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    content: `# Privacy Policy

Last updated: ${new Date().toLocaleDateString()}

This Privacy Policy explains what personal data we collect, why, and how we protect it.

## Data we collect
- Account data: name, email, role.
- Booking data: service selection, scheduling metadata, notes you submit.
- Technical data: session identifiers and basic device information required to operate the app.

## Legal bases (GDPR/UK GDPR)
- Contract: to provide the Service you request.
- Legitimate interests: security, service quality, and fraud prevention.
- Consent: for optional cookies/analytics where required.

## Sharing
We do not sell personal data. We share data with sub-processors solely to operate the Service (authentication, hosting, email delivery).

## Your rights
Subject to applicable law you may access, correct, delete, port, or restrict processing of your personal data. Contact the administrator to exercise these rights.

## Security
We implement administrative, technical, and organizational safeguards appropriate to the risk, including role-based access control, encrypted transport, and least-privilege access.

## Retention
See our Data Retention Policy.

## International transfers
Where data is transferred internationally, we rely on lawful mechanisms such as Standard Contractual Clauses.

## Contact
Contact the platform administrator with any privacy questions or requests.`,
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    content: `# Cookie Policy

Last updated: ${new Date().toLocaleDateString()}

We use cookies and similar technologies (including localStorage) to operate the Service.

## Categories
- Strictly necessary: authentication session, security, and preference storage. These cannot be disabled without breaking the Service.
- Functional: theme, layout preferences.
- Analytics: only if enabled and where legally required, based on your consent.

## Managing cookies
You can clear cookies and site data at any time through your browser. Doing so will sign you out and reset preferences.

## Third parties
Authentication may set cookies from our identity provider. Refer to their policy for details.

## Contact
Contact the platform administrator with cookie questions.`,
  },
  {
    slug: "retention",
    title: "Data Retention Policy",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    content: `# Data Retention Policy

Last updated: ${new Date().toLocaleDateString()}

We retain personal data only as long as necessary for the purposes described in our Privacy Policy or as required by law.

## Retention periods
- Active account data: for the duration of the account plus a reasonable wind-down period.
- Booking records: retained to support historical scheduling, dispute resolution, and legal obligations, typically no longer than 7 years.
- Security/audit logs: typically 12–24 months.
- Marketing preferences: retained until withdrawn.

## Deletion & anonymization
When a retention period ends we delete or anonymize the data. Backups are overwritten on their normal cycle.

## Requests
You may request earlier deletion where you have the right to do so. Some data may be retained where we are legally required to keep it.`,
  },
  {
    slug: "dpa",
    title: "Data Processing Addendum",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    content: `# Data Processing Addendum (DPA)

Last updated: ${new Date().toLocaleDateString()}

This DPA forms part of the agreement between you (the "Controller") and the platform operator (the "Processor") where we process personal data on your behalf.

## 1. Subject-matter
Processing of personal data in connection with the Service.

## 2. Duration
For the term of your account plus any period required by law.

## 3. Nature and purpose
To provide, secure, and improve the Service.

## 4. Categories of data subjects
End users, administrators, practitioners, and other individuals identified in the Controller's data.

## 5. Categories of personal data
Contact details, account credentials, booking metadata, and any content the Controller submits.

## 6. Processor obligations
- Process personal data only on documented instructions from the Controller.
- Ensure personnel are bound by confidentiality.
- Implement appropriate technical and organizational measures.
- Assist the Controller with data subject requests and breach notifications.
- Delete or return personal data at the end of the engagement.

## 7. Sub-processors
The Processor may engage sub-processors under written obligations no less protective than this DPA.

## 8. International transfers
Where applicable, Standard Contractual Clauses apply.

## 9. Audit
The Controller may request reasonable information to verify compliance with this DPA.`,
  },
  {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    content: `# Acceptable Use Policy

Last updated: ${new Date().toLocaleDateString()}

You agree not to use the Service to:

- Violate any applicable law or the rights of any person.
- Upload malware, exploit vulnerabilities, or attempt to gain unauthorized access.
- Scrape, harvest, or systematically extract data.
- Harass, threaten, or endanger any individual.
- Impersonate any person or misrepresent your affiliation.
- Circumvent authentication, rate limits, or role-based access controls.
- Interfere with service availability (e.g., denial-of-service).
- Use the Service to store or transmit unlawful, harmful, or infringing content.

## Enforcement
We may investigate suspected violations and take action including content removal, account suspension, or termination. Serious violations may be reported to authorities.

## Reporting
Report abuse to the platform administrator.`,
  },
];

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function emit() {
  try { window.dispatchEvent(new Event(CHANGE_EVENT)); } catch { /* SSR */ }
}

export function readLegalDocs(): LegalDoc[] {
  if (typeof window === "undefined") return DEFAULTS;
  const stored = safeParse<LegalDoc[] | null>(localStorage.getItem(STORAGE_KEY), null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS));
    return DEFAULTS;
  }
  // Ensure any missing default slugs are present (forward-compat)
  const bySlug = new Map(stored.map((d) => [d.slug, d]));
  let mutated = false;
  for (const def of DEFAULTS) {
    if (!bySlug.has(def.slug)) { bySlug.set(def.slug, def); mutated = true; }
  }
  const merged = Array.from(bySlug.values());
  if (mutated) localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function getLegalDoc(slug: LegalSlug): LegalDoc | undefined {
  return readLegalDocs().find((d) => d.slug === slug);
}

export function saveLegalDoc(
  slug: LegalSlug,
  patch: { title: string; content: string },
  editor: string
): LegalDoc {
  const title = patch.title.trim().slice(0, MAX_TITLE_LEN);
  const content = patch.content;
  if (!title) throw new Error("Title is required");
  const bytes = new Blob([content]).size;
  if (bytes > MAX_CONTENT_BYTES) {
    throw new Error(`Content exceeds maximum size (${MAX_CONTENT_BYTES} bytes)`);
  }
  const docs = readLegalDocs();
  const idx = docs.findIndex((d) => d.slug === slug);
  if (idx === -1) throw new Error("Unknown document");
  const prev = docs[idx];
  const next: LegalDoc = {
    ...prev,
    title,
    content,
    version: prev.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: editor || "unknown",
  };
  docs[idx] = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));

  // Audit log (append, cap at 500 entries)
  const audit = safeParse<LegalAuditEntry[]>(localStorage.getItem(AUDIT_KEY), []);
  audit.unshift({ slug, editor: editor || "unknown", at: next.updatedAt, version: next.version, bytes });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(audit.slice(0, 500)));

  emit();
  return next;
}

export function readAuditLog(): LegalAuditEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse<LegalAuditEntry[]>(localStorage.getItem(AUDIT_KEY), []);
}

export function useLegalDocs(): LegalDoc[] {
  const [docs, setDocs] = useState<LegalDoc[]>(() => readLegalDocs());
  useEffect(() => {
    const h = () => setDocs(readLegalDocs());
    window.addEventListener(CHANGE_EVENT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(CHANGE_EVENT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return docs;
}

// ---------- Re-authentication (defense in depth for privileged edits) ----------

const DEMO_CREDS: Record<string, string> = {
  "student@bookflow.demo": "student123",
  "admin@bookflow.demo": "admin123",
  "webmaster@bookflow.demo": "webmaster123",
};

interface AttemptRecord { count: number; firstAt: number; lockedUntil?: number }

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000;

export function reauthStatus(email: string): { locked: boolean; remainingMs: number } {
  const map = safeParse<Record<string, AttemptRecord>>(localStorage.getItem(REAUTH_ATTEMPTS_KEY), {});
  const rec = map[email.toLowerCase()];
  if (!rec) return { locked: false, remainingMs: 0 };
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) {
    return { locked: true, remainingMs: rec.lockedUntil - Date.now() };
  }
  return { locked: false, remainingMs: 0 };
}

function recordAttempt(email: string, success: boolean) {
  const map = safeParse<Record<string, AttemptRecord>>(localStorage.getItem(REAUTH_ATTEMPTS_KEY), {});
  const key = email.toLowerCase();
  const now = Date.now();
  const rec = map[key] ?? { count: 0, firstAt: now };
  if (success) {
    delete map[key];
  } else {
    if (now - rec.firstAt > WINDOW_MS) {
      map[key] = { count: 1, firstAt: now };
    } else {
      rec.count += 1;
      if (rec.count >= MAX_ATTEMPTS) {
        rec.lockedUntil = now + LOCKOUT_MS;
      }
      map[key] = rec;
    }
  }
  localStorage.setItem(REAUTH_ATTEMPTS_KEY, JSON.stringify(map));
}

/**
 * Verify a webmaster/admin identity before privileged writes.
 * Accepts either demo credentials or credentials of a registered local user.
 * Returns true iff credentials match AND the account role is webmaster or admin.
 */
export function verifyPrivilegedCredentials(email: string, password: string): boolean {
  if (!email || !password) return false;
  const status = reauthStatus(email);
  if (status.locked) return false;

  const lower = email.toLowerCase();
  let ok = false;
  let role: string | undefined;

  if (DEMO_CREDS[lower] && DEMO_CREDS[lower] === password) {
    ok = true;
    role = lower.includes("webmaster") ? "webmaster" : lower.includes("admin") ? "admin" : "fellow";
  } else {
    // Registered local users (created by webmaster). Passwords are stored
    // locally for the demo backend; production should verify against a
    // server-side auth provider instead.
    const registered = safeParse<Array<{ email: string; password?: string; role?: string }>>(
      localStorage.getItem("kit_registered_users_v1"),
      []
    );
    const match = registered.find((u) => u.email?.toLowerCase() === lower);
    if (match && match.password && match.password === password) {
      ok = true;
      role = match.role;
    }
  }

  const privileged = role === "webmaster" || role === "admin";
  const success = ok && privileged;
  recordAttempt(email, success);
  return success;
}
