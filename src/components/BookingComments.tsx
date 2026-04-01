import { useState, useEffect } from "react";
import { MessageSquare, Pencil, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface BookingCommentsProps {
  bookingId: string;
  canEdit?: boolean;
}

function getStorageKey(bookingId: string) {
  return `booking-comments-${bookingId}`;
}

function loadComments(bookingId: string): Comment[] {
  try {
    const raw = localStorage.getItem(getStorageKey(bookingId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveComments(bookingId: string, comments: Comment[]) {
  localStorage.setItem(getStorageKey(bookingId), JSON.stringify(comments));
}

const BookingComments = ({ bookingId, canEdit = true }: BookingCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>(() => loadComments(bookingId));
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    setComments(loadComments(bookingId));
  }, [bookingId]);

  const persist = (updated: Comment[]) => {
    setComments(updated);
    saveComments(bookingId, updated);
  };

  const handleAdd = () => {
    if (!newText.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      text: newText.trim(),
      author: "You",
      createdAt: new Date().toISOString(),
    };
    persist([comment, ...comments]);
    setNewText("");
  };

  const handleDelete = (id: string) => {
    persist(comments.filter((c) => c.id !== id));
  };

  const startEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditText(c.text);
  };

  const saveEdit = () => {
    if (!editText.trim() || !editingId) return;
    persist(comments.map((c) => (c.id === editingId ? { ...c, text: editText.trim() } : c)));
    setEditingId(null);
    setEditText("");
  };

  return (
    <div className="mt-3 border-t pt-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        Comments
      </p>

      {canEdit && (
        <div className="mb-3 flex gap-2">
          <Textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[60px] text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button size="sm" onClick={handleAdd} disabled={!newText.trim()} className="shrink-0 self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg bg-accent/50 px-3 py-2">
            {editingId === c.id ? (
              <div className="space-y-2">
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[50px] text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={saveEdit}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm text-foreground">{c.text}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {c.author} · {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(c)} className="rounded p-1 hover:bg-accent">
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="rounded p-1 hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingComments;
