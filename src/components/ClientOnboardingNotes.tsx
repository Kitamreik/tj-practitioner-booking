import { useState, useEffect } from "react";
import {
  ClipboardList, Sparkles, Pencil, Trash2, Save, X, AlertTriangle, ChevronDown,
  ArrowUp, ArrowDown, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { randomScenarioForService, type ScenarioCategory } from "@/lib/onboardingScenarios";
import { onboardingApi, type OnboardingNotePayload } from "@/lib/api";
import { toast } from "sonner";

interface OnboardingNote {
  id: string;
  category: ScenarioCategory | string;
  contentWarnings: string[];
  title: string;
  body: string;
  createdAt: string;
}

interface ClientOnboardingNotesProps {
  bookingId: string;
  service: string;
  canEdit: boolean;
}

const storageKey = (bookingId: string) => `onboarding-notes-${bookingId}`;

function loadLocalNotes(bookingId: string): OnboardingNote[] {
  try {
    const raw = localStorage.getItem(storageKey(bookingId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotes(bookingId: string, notes: OnboardingNote[]) {
  localStorage.setItem(storageKey(bookingId), JSON.stringify(notes));
}

function toPayload(bookingId: string, notes: OnboardingNote[]): OnboardingNotePayload[] {
  return notes.map((n, i) => ({ ...n, bookingId, order: i }));
}

const ClientOnboardingNotes = ({ bookingId, service, canEdit }: ClientOnboardingNotesProps) => {
  const [notes, setNotes] = useState<OnboardingNote[]>([]);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<OnboardingNote | null>(null);

  // Load: local first (instant), then backend (overrides if available)
  useEffect(() => {
    setNotes(loadLocalNotes(bookingId));
    onboardingApi
      .getByBooking(bookingId)
      .then((remote) => {
        if (Array.isArray(remote) && remote.length >= 0) {
          const sorted = [...remote].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const mapped: OnboardingNote[] = sorted.map((r) => ({
            id: r.id,
            category: r.category,
            contentWarnings: r.contentWarnings || [],
            title: r.title,
            body: r.body,
            createdAt: r.createdAt,
          }));
          setNotes(mapped);
          saveLocalNotes(bookingId, mapped);
        }
      })
      .catch(() => {
        // backend unavailable — local is the failsafe
      });
  }, [bookingId]);

  const persist = (next: OnboardingNote[]) => {
    setNotes(next);
    saveLocalNotes(bookingId, next);
    onboardingApi.saveAll(bookingId, toPayload(bookingId, next)).catch(() => {
      // silent: local copy already saved
    });
  };

  const handleGenerate = () => {
    const existingCats = notes.map((n) => n.category as ScenarioCategory);
    const tpl = randomScenarioForService(service, existingCats);
    const note: OnboardingNote = {
      id: crypto.randomUUID(),
      category: tpl.category,
      contentWarnings: tpl.contentWarnings,
      title: tpl.title,
      body: tpl.body,
      createdAt: new Date().toISOString(),
    };
    persist([note, ...notes]);
    toast.success(`Seeded scenario: ${tpl.category}`);
  };

  const handleRegenerate = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const otherCats = notes
      .filter((n) => n.id !== id)
      .map((n) => n.category as ScenarioCategory);
    const tpl = randomScenarioForService(service, otherCats);
    const replaced: OnboardingNote = {
      id: target.id,
      category: tpl.category,
      contentWarnings: tpl.contentWarnings,
      title: tpl.title,
      body: tpl.body,
      createdAt: new Date().toISOString(),
    };
    persist(notes.map((n) => (n.id === id ? replaced : n)));
    toast.success(`Regenerated as: ${tpl.category}`);
  };

  const move = (id: string, direction: -1 | 1) => {
    const idx = notes.findIndex((n) => n.id === id);
    if (idx < 0) return;
    const swap = idx + direction;
    if (swap < 0 || swap >= notes.length) return;
    const next = [...notes];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    persist(next);
  };

  const startEdit = (n: OnboardingNote) => {
    setEditingId(n.id);
    setDraft({ ...n });
  };

  const saveEdit = () => {
    if (!draft || !editingId) return;
    persist(notes.map((n) => (n.id === editingId ? draft : n)));
    setEditingId(null);
    setDraft(null);
    toast.success("Scenario updated");
  };

  const handleDelete = (id: string) => {
    persist(notes.filter((n) => n.id !== id));
    toast.success("Scenario removed");
  };

  return (
    <div className="mt-3 border-t pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ClipboardList className="h-3.5 w-3.5" />
          Client Onboarding Notes
        </p>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={handleGenerate} className="h-7 gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Generate seed scenario
          </Button>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="rounded-lg bg-accent/30 px-3 py-2 text-xs text-muted-foreground">
          No onboarding scenarios yet. {canEdit && "Click \u201CGenerate seed scenario\u201D to draft one based on this meeting type."}
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map((n, i) => {
            const isOpen = !!openIds[n.id];
            const isEditing = editingId === n.id;
            return (
              <div key={n.id} className="rounded-lg border bg-card px-3 py-2">
                {isEditing && draft ? (
                  <div className="space-y-2">
                    <Input
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                      placeholder="Category"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="Scenario title"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={draft.contentWarnings.join(", ")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          contentWarnings: e.target.value
                            .split(",")
                            .map((w) => w.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Content warnings (comma separated)"
                      className="h-8 text-sm"
                    />
                    <Textarea
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      className="min-h-[100px] text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="gap-1.5">
                        <Save className="h-3.5 w-3.5" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setDraft(null); }} className="gap-1.5">
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Collapsible open={isOpen} onOpenChange={(o) => setOpenIds((p) => ({ ...p, [n.id]: o }))}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">{n.category}</Badge>
                          <span className="text-sm font-medium text-foreground">{n.title}</span>
                        </div>
                        {n.contentWarnings.length > 0 && (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                            <span className="text-[10px] uppercase tracking-wider text-destructive">Content warnings:</span>
                            {n.contentWarnings.map((cw) => (
                              <Badge key={cw} variant="outline" className="border-destructive/40 text-[10px] text-destructive">
                                {cw}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            onClick={() => move(n.id, -1)}
                            disabled={i === 0}
                            className="rounded p-1 hover:bg-accent disabled:opacity-30"
                            aria-label="Move up"
                          >
                            <ArrowUp className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => move(n.id, 1)}
                            disabled={i === notes.length - 1}
                            className="rounded p-1 hover:bg-accent disabled:opacity-30"
                            aria-label="Move down"
                          >
                            <ArrowDown className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleRegenerate(n.id)}
                            className="rounded p-1 hover:bg-accent"
                            aria-label="Regenerate scenario"
                            title="Regenerate seed scenario"
                          >
                            <RefreshCw className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button onClick={() => startEdit(n)} className="rounded p-1 hover:bg-accent" aria-label="Edit scenario">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDelete(n.id)} className="rounded p-1 hover:bg-destructive/10" aria-label="Delete scenario">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>
                    <CollapsibleTrigger asChild>
                      <button className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        {isOpen ? "Hide scenario" : "Reveal scenario"}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{n.body}</p>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientOnboardingNotes;
