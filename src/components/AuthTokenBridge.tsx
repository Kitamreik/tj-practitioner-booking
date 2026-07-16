import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { registerAuthTokenProvider } from "@/lib/api";

/**
 * Registers Clerk's `getToken()` with the API layer so every privileged
 * request automatically attaches a fresh JWT. Mount once inside
 * <ClerkProvider>. Unmounts clear the provider so no stale token leaks.
 */
const AuthTokenBridge = () => {
  let getToken: (() => Promise<string | null>) | null = null;
  try {
    getToken = useAuth().getToken;
  } catch {
    getToken = null;
  }

  useEffect(() => {
    if (!getToken) {
      registerAuthTokenProvider(null);
      return;
    }
    registerAuthTokenProvider(() => getToken!());
    return () => registerAuthTokenProvider(null);
  }, [getToken]);

  return null;
};

export default AuthTokenBridge;
