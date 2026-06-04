import { useEffect, useState, useCallback } from "react";
import { SCENARIO_LIBRARY } from "./onboardingScenarios";

export interface ServiceEntry {
  id: string;
  name: string;
  enabled: boolean;
  /** Set on seeded defaults so the admin UI can show provenance. Custom entries are false. */
  seeded?: boolean;
}

const STORAGE_KEY = "kit_services_registry_v1";
const CHANGE_EVENT = "kit-services-registry-changed";

export const DEFAULT_SERVICES: string[] = [
  "Organizational Systems Work",
  "Panels and Talks",
  "Remote & In- Person Conferences",
  "Workshops",
  "One-on-One Consulting",
  "Short Term/Long Term Retainer",
  "Crisis and Case Management",
];

function seed(): ServiceEntry[] {
  return DEFAULT_SERVICES.map((name) => ({
    id: name,
    name,
    enabled: true,
    seeded: true,
  }));
}

function safeParse(raw: string | null): ServiceEntry[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (e): e is ServiceEntry =>
        e &&
        typeof e.id === "string" &&
        typeof e.name === "string" &&
        typeof e.enabled === "boolean"
    );
  } catch {
    return null;
  }
}

/** Read the full registry (including disabled). Used by admin UI. */
export function readServices(): ServiceEntry[] {
  if (typeof window === "undefined") return seed();
  const existing = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (existing && existing.length > 0) {
    // Merge any newly added defaults that weren't previously seeded
    const known = new Set(existing.map((s) => s.name.toLowerCase()));
    const additions = seed().filter((s) => !known.has(s.name.toLowerCase()));
    if (additions.length > 0) {
      const merged = [...existing, ...additions];
      writeServices(merged, { silent: true });
      return merged;
    }
    return existing;
  }
  const fresh = seed();
  writeServices(fresh, { silent: true });
  return fresh;
}

export function writeServices(next: ServiceEntry[], opts: { silent?: boolean } = {}) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  if (!opts.silent) {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function addService(name: string): ServiceEntry | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const all = readServices();
  if (all.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return null;
  const entry: ServiceEntry = { id: trimmed, name: trimmed, enabled: true, seeded: false };
  writeServices([...all, entry]);
  return entry;
}

export function renameService(id: string, newName: string): boolean {
  const trimmed = newName.trim();
  if (!trimmed) return false;
  const all = readServices();
  if (all.some((s) => s.id !== id && s.name.toLowerCase() === trimmed.toLowerCase())) return false;
  writeServices(all.map((s) => (s.id === id ? { ...s, name: trimmed } : s)));
  return true;
}

export function setServiceEnabled(id: string, enabled: boolean): void {
  const all = readServices();
  writeServices(all.map((s) => (s.id === id ? { ...s, enabled } : s)));
}

export function removeService(id: string): boolean {
  const all = readServices();
  const target = all.find((s) => s.id === id);
  // Seeded defaults can be disabled but not deleted, to keep behavior consistent with prior bookings.
  if (!target || target.seeded) return false;
  writeServices(all.filter((s) => s.id !== id));
  return true;
}

/** Reset to seeded defaults — exposed for tests. */
export function resetServicesForTest(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** True when at least one scenario in the library lists this service in `fitsServices`. */
export function hasMappedScenarios(service: string): boolean {
  const target = service.trim().toLowerCase();
  if (!target) return false;
  return SCENARIO_LIBRARY.some((s) =>
    (s.fitsServices ?? []).some((f) => f.trim().toLowerCase() === target)
  );
}

/** React hook: returns enabled-only services for booking forms. */
export function useEnabledServices(): ServiceEntry[] {
  const [list, setList] = useState<ServiceEntry[]>(() => readServices());
  useEffect(() => {
    const handler = () => setList(readServices());
    window.addEventListener(CHANGE_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return list.filter((s) => s.enabled);
}

/** React hook: returns all services (including disabled) for admin UI. */
export function useAllServices(): [ServiceEntry[], () => void] {
  const [list, setList] = useState<ServiceEntry[]>(() => readServices());
  const refresh = useCallback(() => setList(readServices()), []);
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(CHANGE_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);
  return [list, refresh];
}
