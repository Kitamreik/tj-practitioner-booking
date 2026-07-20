import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";

interface LocalAuth {
  email?: string;
  signedIn?: boolean;
}

const readLocal = (): LocalAuth => {
  try {
    return JSON.parse(localStorage.getItem("local-auth") || "{}");
  } catch {
    return {};
  }
};

/**
 * Lightweight signed-in check for public pages that need conditional CTAs.
 * Combines Clerk (if configured) with the local-auth fallback and stays in
 * sync with cross-tab sign-out via the storage event.
 */
export function useIsSignedIn(): { isSignedIn: boolean; isLoaded: boolean } {
  let clerkLoaded = true;
  let clerkSignedIn = false;
  try {
    const { user, isLoaded } = useUser();
    clerkLoaded = isLoaded;
    clerkSignedIn = !!user;
  } catch {
    clerkLoaded = true;
  }

  const [local, setLocal] = useState<LocalAuth>(() => readLocal());
  useEffect(() => {
    const refresh = () => setLocal(readLocal());
    window.addEventListener("storage", refresh);
    window.addEventListener("registered-accounts:changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("registered-accounts:changed", refresh);
    };
  }, []);

  const localSignedIn = !!local.signedIn && !!local.email;
  return { isSignedIn: clerkSignedIn || localSignedIn, isLoaded: clerkLoaded };
}
