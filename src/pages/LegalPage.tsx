import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getLegalDoc, type LegalSlug, useLegalDocs } from "@/lib/legalDocs";

/**
 * Renders a stored legal document as plain text.
 *
 * IMPORTANT (XSS defense):
 * Content is stored as untrusted user input and MUST be rendered as text,
 * never via dangerouslySetInnerHTML. We split on newlines and let React
 * escape each line. Minimal markdown-lite: `#` / `##` headings and blank
 * lines produce paragraph breaks. No inline HTML is executed.
 */
const LegalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  useLegalDocs(); // subscribe to updates
  const doc = useMemo(() => (slug ? getLegalDoc(slug as LegalSlug) : undefined), [slug]);

  if (!doc) {
    return (
      <div className="container py-16">
        <h1 className="font-heading text-2xl font-bold text-foreground">Document not found</h1>
        <p className="mt-2 text-muted-foreground">
          The legal document you requested does not exist.
        </p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>
    );
  }

  const lines = doc.content.split(/\r?\n/);

  return (
    <div className="container max-w-3xl py-10">
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="rounded-2xl border bg-card p-6 sm:p-10">
        <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>
            Version {doc.version} · Last updated {new Date(doc.updatedAt).toLocaleString()}
          </span>
        </div>

        <h1 className="font-heading text-3xl font-bold text-foreground">{doc.title}</h1>

        <article className="mt-6 space-y-3 text-sm leading-relaxed text-foreground">
          {lines.map((raw, i) => {
            const line = raw ?? "";
            if (/^#\s+/.test(line)) {
              // Skip the initial H1 in stored content — page already has a title.
              return null;
            }
            if (/^##\s+/.test(line)) {
              return (
                <h2 key={i} className="mt-6 font-heading text-lg font-semibold text-foreground">
                  {line.replace(/^##\s+/, "")}
                </h2>
              );
            }
            if (/^-\s+/.test(line)) {
              return (
                <p key={i} className="ml-4 text-muted-foreground">
                  • {line.replace(/^-\s+/, "")}
                </p>
              );
            }
            if (line.trim() === "") {
              return <div key={i} className="h-1" aria-hidden />;
            }
            return (
              <p key={i} className="text-muted-foreground">
                {line}
              </p>
            );
          })}
        </article>
      </div>
    </div>
  );
};

export default LegalPage;
