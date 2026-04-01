import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Pencil, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { commentsApi, type BookingComment } from "@/lib/api";

interface BookingCommentsProps {
  bookingId: string;
  canEdit?: boolean;
}

function getStorageKey(bookingId: string) {
  return `booking-comments-${bookingId}`;
}

function loadLocal(bookingId: string): BookingComment[] {
  try {
    const raw = localStorage.getItem(getStorageKey(bookingId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(bookingId: string, comments: BookingComment[]) {
  localStorage.setItem(getStorageKey(bookingId), JSON.stringify(comments));
}

const BookingComments = ({ bookingId, canEdit = true }: BookingCommentsProps) => {
  const [comments, setComments] = useState<BookingComment[]>([]);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [usingLocal, setUsingLocal] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const data = await commentsApi.getByBooking(bookingId);
      setComments(data);
      setUsingLocal(false);
    } catch {
      setComments(loadLocal(bookingId));
      setUsingLocal(true);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const persist = (updated: BookingComment[]) => {
    setComments(updated);
    if (usingLocal) saveLocal(bookingId, updated);
  };

  const handleAdd = async () => {
    if (!newText.trim()) return;
    const commentData = { text: newText.trim(), author: "You", bookingId };
    try {
      if (!usingLocal) {
        const created = await commentsApi.create(commentData);
        setComments((prev) => [created, ...prev]);
      } else {
        const local: BookingComment = { ...commentData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        persist([local, ...comments]);
      }
    } catch {
      const local: BookingComment = { ...commentData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      persist([local, ...comments]);
    }
    setNewText("");
  };

  const handleDelete = async (id: string) => {
    try {
      if (!usingLocal) await commentsApi.delete(id);
    } catch { /* fall through */ }
    persist(comments.filter((c) => c.id !== id));
  };

  const startEdit = (c: BookingComment) => {
    setEditingId(c.id);
    setEditText(c.text);
  };

  const saveEdit = async () => {
    if (!editText.trim() || !editingId) return;
    try {
      if (!usingLocal) await commentsApi.update(editingId, { text: editText.trim() });
    } catch { /* fall through */ }
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
