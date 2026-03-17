import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const CHECKLIST_ITEMS = [
  { key: "intake", label: "Intake Done" },
  { key: "logistics", label: "Logistics Staging" },
  { key: "plan", label: "Moving Forward Plan Implemented" },
  { key: "followup", label: "Follow Up Communication" },
  { key: "termination", label: "Termination Report" },
] as const;

export type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]["key"];

interface BookingChecklistProps {
  bookingId: string;
  onChange?: () => void;
}

function getStorageKey(bookingId: string) {
  return `booking-checklist-${bookingId}`;
}

export function getChecklistState(bookingId: string): Record<ChecklistKey, boolean> {
  try {
    const raw = localStorage.getItem(getStorageKey(bookingId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { intake: false, logistics: false, plan: false, followup: false, termination: false };
}

export function getAllChecklistKeys(): readonly { key: ChecklistKey; label: string }[] {
  return CHECKLIST_ITEMS;
}

const BookingChecklist = ({ bookingId, onChange }: BookingChecklistProps) => {
  const [checked, setChecked] = useState<Record<ChecklistKey, boolean>>(() =>
    getChecklistState(bookingId)
  );

  useEffect(() => {
    setChecked(getChecklistState(bookingId));
  }, [bookingId]);

  const toggle = (key: ChecklistKey) => {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    localStorage.setItem(getStorageKey(bookingId), JSON.stringify(next));
    onChange?.();
    window.dispatchEvent(new Event("checklist-updated"));
  };

  return (
    <div className="mt-3 border-t pt-3">
      <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Checklist</p>
      <div className="space-y-1.5">
        {CHECKLIST_ITEMS.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent"
          >
            <Checkbox
              checked={checked[item.key]}
              onCheckedChange={() => toggle(item.key)}
            />
            <span className={checked[item.key] ? "text-muted-foreground line-through" : "text-foreground"}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default BookingChecklist;
