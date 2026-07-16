import { useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Lock, ShieldCheck, FileText, History, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MAX_CONTENT_BYTES, MAX_TITLE_LEN,
  readAuditLog, reauthStatus, saveLegalDoc, useLegalDocs, verifyPrivilegedCredentials,
  type LegalDoc,
} from "@/lib/legalDocs";
import { useRole } from "@/lib/roles";

function useSignedInEmail(): string {
  try {
    // Prefer Clerk email if available
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { user } = useUser();
    if (user?.primaryEmailAddress?.emailAddress) return user.primaryEmailAddress.emailAddress;
  } catch { /* Clerk not configured */ }
  try {
    const local = JSON.parse(localStorage.getItem("local-auth") || "{}");
    if (local?.email) return String(local.email);
  } catch { /* ignore */ }
  return "";
}

const LegalDocsManager = () => {
  const docs = useLegalDocs();
  const { isWebmaster, isAdmin } = useRole();
  const email = useSignedInEmail();

  const [selected, setSelected] = useState<string>(docs[0]?.slug ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<{ slug: string; title: string; content: string } | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { title: string; content: string }>>({});

  const current: LegalDoc | undefined = useMemo(
    () => docs.find((d) => d.slug === selected) ?? docs[0],
    [docs, selected]
  );

  if (!isWebmaster && !isAdmin) return null;
  if (!current) return null;

  const draft = drafts[current.slug];
  const title = draft?.title ?? current.title;
  const content = draft?.content ?? current.content;
  const dirty = title !== current.title || content !== current.content;
  const bytes = new Blob([content]).size;
  const overBudget = bytes > MAX_CONTENT_BYTES;

  const audit = readAuditLog().filter((a) => a.slug === current.slug).slice(0, 8);

  const updateDraft = (patch: Partial<{ title: string; content: string }>) => {
    setDrafts((prev) => ({
      ...prev,
      [current.slug]: {
        title: patch.title ?? title,
        content: patch.content ?? content,
      },
    }));
  };

  const handleSaveClick = () => {
    if (!dirty) { toast.info("No changes to save."); return; }
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (overBudget) { toast.error("Content exceeds the maximum size."); return; }
    setPendingDraft({ slug: current.slug, title, content });
    setConfirmEmail(email);
    setConfirmPassword("");
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingDraft) return;
    const status = reauthStatus(confirmEmail);
    if (status.locked) {
      toast.error(`Too many attempts. Try again in ${Math.ceil(status.remainingMs / 60000)} min.`);
      return;
    }
    const ok = verifyPrivilegedCredentials(confirmEmail, confirmPassword);
    if (!ok) {
      toast.error("Credential check failed. Webmaster or admin credentials required.");
      return;
    }
    try {
      saveLegalDoc(pendingDraft.slug as LegalDoc["slug"], {
        title: pendingDraft.title,
        content: pendingDraft.content,
      }, confirmEmail);
      toast.success(`${pendingDraft.title} saved.`);
      setDrafts((prev) => { const n = { ...prev }; delete n[pendingDraft.slug]; return n; });
      setConfirmOpen(false);
      setPendingDraft(null);
      setConfirmPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save.");
    }
  };

  return (
    <div className="mt-10 rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Legal &amp; Compliance Documents</h2>
          <p className="text-sm text-muted-foreground">
            Edit the policies shown in the footer. Saving requires credential re-verification.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {docs.map((d) => (
          <button
            key={d.slug}
            type="button"
            onClick={() => setSelected(d.slug)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              d.slug === current.slug
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {d.title}
            {drafts[d.slug] ? <span className="ml-1 text-warning">•</span> : null}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="legal-title">Title</Label>
          <Input
            id="legal-title"
            value={title}
            maxLength={MAX_TITLE_LEN}
            onChange={(e) => updateDraft({ title: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="legal-content">Content (plain text / Markdown-lite)</Label>
            <span className={`text-xs ${overBudget ? "text-destructive" : "text-muted-foreground"}`}>
              {bytes.toLocaleString()} / {MAX_CONTENT_BYTES.toLocaleString()} bytes
            </span>
          </div>
          <Textarea
            id="legal-content"
            value={content}
            onChange={(e) => updateDraft({ content: e.target.value })}
            rows={16}
            className="font-mono text-xs"
          />
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            HTML is not rendered. Use <code>#</code>, <code>##</code>, and <code>-</code> for structure.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Version {current.version} · updated by {current.updatedBy} on {new Date(current.updatedAt).toLocaleString()}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!dirty}
              onClick={() => setDrafts((prev) => { const n = { ...prev }; delete n[current.slug]; return n; })}
            >
              Discard
            </Button>
            <Button size="sm" disabled={!dirty || overBudget} onClick={handleSaveClick} className="gap-1">
              <Lock className="h-3.5 w-3.5" /> Save with credential check
            </Button>
          </div>
        </div>

        {audit.length > 0 && (
          <div className="mt-4 rounded-lg border bg-background/50 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Recent edits
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {audit.map((a, i) => (
                <li key={`${a.at}-${i}`} className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">v{a.version}</Badge>
                  <span>{new Date(a.at).toLocaleString()}</span>
                  <span>·</span>
                  <span>{a.editor}</span>
                  <span>·</span>
                  <span>{a.bytes} bytes</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Confirm your credentials
            </DialogTitle>
            <DialogDescription>
              Editing legal documents is a privileged action. Re-enter your webmaster or admin credentials to save.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="reauth-email">Email</Label>
              <Input
                id="reauth-email"
                type="email"
                autoComplete="username"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reauth-password">Password</Label>
              <Input
                id="reauth-password"
                type="password"
                autoComplete="current-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                After 5 failed attempts your account is locked for 15 minutes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm} className="gap-1">
              <ShieldCheck className="h-4 w-4" /> Confirm &amp; Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LegalDocsManager;
