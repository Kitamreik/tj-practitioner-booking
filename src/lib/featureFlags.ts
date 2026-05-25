// Webmaster-controlled production toggles, persisted in localStorage.

const KEY = "feature-flags";

export interface FeatureFlags {
  demoAccountsEnabled: boolean;
  googleSignInEnabled: boolean;
}

const DEFAULTS: FeatureFlags = {
  demoAccountsEnabled: true,
  googleSignInEnabled: true,
};

export function getFeatureFlags(): FeatureFlags {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function setFeatureFlags(next: Partial<FeatureFlags>) {
  const current = getFeatureFlags();
  const merged = { ...current, ...next };
  localStorage.setItem(KEY, JSON.stringify(merged));
  window.dispatchEvent(new Event("feature-flags-updated"));
  return merged;
}

import { useEffect, useState } from "react";

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(() => getFeatureFlags());
  useEffect(() => {
    const handler = () => setFlags(getFeatureFlags());
    window.addEventListener("feature-flags-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("feature-flags-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return flags;
}
