import { Link } from "react-router-dom";
import { Calendar, Shield } from "lucide-react";
import { useLegalDocs } from "@/lib/legalDocs";
import { useRole } from "@/lib/roles";

const Footer = () => {
  const docs = useLegalDocs();
  const { isAdmin, isFellow, isWebmaster } = useRole();

  const primary = [
    { to: "/", label: "Home", show: true },
    { to: "/reservations", label: "Reservations", show: true },
    { to: "/api/bookings/", label: "Bookings", show: isFellow },
    { to: "/fellows", label: "Fellows", show: isFellow },
    { to: "/practicum", label: "Practicum", show: isFellow },
    { to: "/profile", label: "Profile", show: isFellow },
    { to: "/admin", label: "Admin", show: isWebmaster || isAdmin },
    { to: "/webmaster", label: "Webmaster", show: isWebmaster || isAdmin },
  ].filter((l) => l.show);

  return (
    <footer className="mt-16 border-t bg-card/60">
      <div className="container grid gap-8 py-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold text-foreground">BookFlow</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            A practitioner booking platform. Compliance-focused, role-based, and secured by design.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-background/50 px-2.5 py-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" aria-hidden />
            GDPR &middot; OWASP ASVS aligned
          </div>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground">Platform</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {primary.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h3 className="font-heading text-sm font-semibold text-foreground">Legal &amp; Compliance</h3>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {docs.map((d) => (
              <li key={d.slug}>
                <Link
                  to={`/legal/${d.slug}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-start justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} BookFlow. All rights reserved.</p>
          <p>
            Report security issues to the platform administrator. See our{" "}
            <Link to="/legal/acceptable-use" className="underline hover:text-foreground">Acceptable Use Policy</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
