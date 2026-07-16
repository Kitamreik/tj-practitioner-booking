import { useEffect, useState } from "react";
import { PenLine, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface BookingSignatureProps {
  bookingId: string;
  canEdit?: boolean;
}

interface SignatureRecord {
  name: string;
  signedAt: string;
}

function storageKey(id: string) {
  return `booking-signature-${id}`;
}

function loadSignature(id: string): SignatureRecord | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? (JSON.parse(raw) as SignatureRecord) : null;
  } catch {
    return null;
  }
}

const BookingSignature = ({ bookingId, canEdit = true }: BookingSignatureProps) => {
  const [name, setName] = useState("");
  const [record, setRecord] = useState<SignatureRecord | null>(null);

  useEffect(() => {
    setRecord(loadSignature(bookingId));
  }, [bookingId]);

  const handleSign = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter your name to sign.");
      return;
    }
    if (trimmed.length > 120) {
      toast.error("Name is too long.");
      return;
    }
    const next: SignatureRecord = { name: trimmed, signedAt: new Date().toISOString() };
    try {
      localStorage.setItem(storageKey(bookingId), JSON.stringify(next));
      setRecord(next);
      setName("");
      toast.success("Signature saved.");
    } catch {
      toast.error("Could not save signature locally.");
    }
  };

  const handleClear = () => {
    localStorage.removeItem(storageKey(bookingId));
    setRecord(null);
    toast.info("Signature cleared.");
  };

  return (
    <div className="mt-3 border-t pt-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <PenLine className="h-3.5 w-3.5" />
        Signature
      </p>

      {record ? (
        <div className="rounded-lg border bg-accent/40 p-3">
          <p className="font-heading text-base italic text-foreground" style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive" }}>
            {record.name}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Signed on {new Date(record.signedAt).toLocaleString()}
            </p>
            {canEdit && (
              <button
                onClick={handleClear}
                className="text-xs text-destructive hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      ) : canEdit ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type your full name to sign"
            maxLength={120}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSign();
              }
            }}
          />
          <Button onClick={handleSign} disabled={!name.trim()} className="gap-1 shrink-0">
            <Check className="h-4 w-4" /> Sign
          </Button>
        </div>
      ) : (
        <p className="text-xs italic text-muted-foreground">No signature on file.</p>
      )}
    </div>
  );
};

export default BookingSignature;
