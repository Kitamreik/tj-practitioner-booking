import { useEffect, useRef, useState } from "react";
import { MessageSquare, Save, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { adminStudentNotesApi } from "@/lib/api";
import { toast } from "sonner";

interface AdminStudentNotesProps {
  bookingId: string;
  canEdit: boolean;
}

const storageKey = (id: string) => `admin-student-notes-${id}`;

const AdminStudentNotes = ({ bookingId, canEdit }: AdminStudentNotesProps) => {
  const [text, setText] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    initialized.current = false;
    // Load local failsafe first
    try {
      const raw = localStorage.getItem(storageKey(bookingId));
      if (raw) {
        const parsed = JSON.parse(raw);
        setText(parsed.text || "");
        setSavedAt(parsed.updatedAt || null);
      } else {
        setText("");
        setSavedAt(null);
      }
    } catch {
      setText("");
    }
    // Then try backend (overrides if available)
    adminStudentNotesApi
      .get(bookingId)
      .then((data) => {
        if (data?.text != null) {
          setText(data.text);
          setSavedAt(data.updatedAt);
          localStorage.setItem(storageKey(bookingId), JSON.stringify(data));
        }
      })
      .catch(() => {
        // backend unavailable — local copy is the failsafe
      })
      .finally(() => {
        initialized.current = true;
      });
  }, [bookingId]);

  const handleSave = async () => {
    setSaving(true);
    const updatedAt = new Date().toISOString();
    // Always persist local failsafe
    localStorage.setItem(storageKey(bookingId), JSON.stringify({ text, updatedAt }));
    setSavedAt(updatedAt);
    try {
      await adminStudentNotesApi.save(bookingId, text);
      toast.success("Note sent to student");
    } catch {
      toast.info("Backend unavailable — saved locally as failsafe.");
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit && !text.trim()) return null;

  return (
    <div className="mt-3 border-t pt-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        Admin notes to student
      </p>
      {canEdit ? (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write next steps, follow-ups, or feedback for the student…"
            className="min-h-[80px] text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {savedAt ? `Last saved ${new Date(savedAt).toLocaleString()}` : "Not saved yet"}
            </p>
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 gap-1.5 text-xs">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save note
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-accent/30 px-3 py-2 text-sm text-foreground/90 whitespace-pre-wrap">
          {text}
          {savedAt && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Updated {new Date(savedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStudentNotes;
