import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSignIn } from "@clerk/clerk-react";
import { logLoginAttempt } from "@/components/LoginMonitor";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  let signInWithGoogle: (() => void) | null = null;
  let signInWithForm: ((e: React.FormEvent) => void) | null = null;

  try {
    const { signIn } = useSignIn();
    signInWithGoogle = () => {
      logLoginAttempt({ email: email || "google-oauth", method: "google", success: true });
      signIn?.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    };
    signInWithForm = (e: React.FormEvent) => {
      e.preventDefault();
      signIn?.create({ identifier: email, password }).then((result) => {
        if (result.status === "complete") {
          logLoginAttempt({ email, method: "local", success: true });
          window.location.href = "/";
        }
      }).catch(() => {
        logLoginAttempt({ email, method: "local", success: false });
        toast.error("Invalid email or password.");
      });
    };
  } catch {
    // Clerk not available
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signInWithForm) {
      signInWithForm(e);
    } else {
      if (!email || !password) {
        toast.error("Please enter email and password.");
        return;
      }
      localStorage.setItem("local-auth", JSON.stringify({ email, signedIn: true }));
      logLoginAttempt({ email, method: "local", success: true });
      toast.success("Signed in locally (demo mode).");
      window.location.href = "/";
    }
  };

  const handleGoogle = () => {
    if (signInWithGoogle) {
      signInWithGoogle();
    } else {
      toast.info("Google OAuth requires Clerk to be configured.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Calendar className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your bookings</p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <button
            onClick={handleGoogle}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-heading text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/sign-up" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
