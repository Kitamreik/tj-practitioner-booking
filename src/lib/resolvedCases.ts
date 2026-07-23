import { useEffect, useState } from "react";
import type { Booking } from "@/lib/mockData";

export interface ResolvedCase {
  booking: Booking;
  resolvedAt: string;
  resolvedBy?: string;
  summary: string;
}

const RESOLVED_KEY = "resolved-cases";
const DELETED_USERS_KEY = "deleted-users";
const EVT = "resolved-cases:changed";
const DEL_EVT = "deleted-users:changed";

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getResolvedCases(): ResolvedCase[] {
  return safeRead<ResolvedCase[]>(RESOLVED_KEY, []);
}

export function isResolved(bookingId: string): boolean {
  return getResolvedCases().some((r) => r.booking.id === bookingId);
}

export function resolveCase(booking: Booking, resolvedBy?: string): ResolvedCase {
  const list = getResolvedCases().filter((r) => r.booking.id !== booking.id);
  const summary = buildSummary(booking);
  const entry: ResolvedCase = {
    booking,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    summary,
  };
  list.unshift(entry);
  localStorage.setItem(RESOLVED_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
  return entry;
}

export function reopenCase(bookingId: string): ResolvedCase | null {
  const list = getResolvedCases();
  const entry = list.find((r) => r.booking.id === bookingId) || null;
  const next = list.filter((r) => r.booking.id !== bookingId);
  localStorage.setItem(RESOLVED_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVT));
  return entry;
}

function buildSummary(b: Booking): string {
  const when = new Date(b.booking_time).toLocaleString();
  return `${b.service} with ${b.customer_name}${b.practitioner ? ` (practitioner: ${b.practitioner})` : ""} — scheduled ${when}. Final status: ${b.status}.`;
}

export function useResolvedCases(): ResolvedCase[] {
  const [items, setItems] = useState<ResolvedCase[]>(() => getResolvedCases());
  useEffect(() => {
    const sync = () => setItems(getResolvedCases());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
}

export function useResolvedIds(): Set<string> {
  const items = useResolvedCases();
  return new Set(items.map((r) => r.booking.id));
}

/* --- Deleted users persistence (webmaster) --- */

export function getDeletedUserIds(): string[] {
  return safeRead<string[]>(DELETED_USERS_KEY, []);
}

export function markUserDeleted(id: string) {
  const set = new Set(getDeletedUserIds());
  set.add(id);
  localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(set)));
  window.dispatchEvent(new Event(DEL_EVT));
}

export function restoreDeletedUser(id: string) {
  const next = getDeletedUserIds().filter((x) => x !== id);
  localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(DEL_EVT));
}

export function useDeletedUserIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(() => new Set(getDeletedUserIds()));
  useEffect(() => {
    const sync = () => setIds(new Set(getDeletedUserIds()));
    window.addEventListener(DEL_EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEL_EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return ids;
}
