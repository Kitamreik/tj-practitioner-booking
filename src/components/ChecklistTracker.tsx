import { useState, useEffect, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { getAllChecklistKeys, getChecklistState, type ChecklistKey } from "@/components/BookingChecklist";
import type { Booking } from "@/lib/mockData";
import { CheckSquare } from "lucide-react";

interface ChecklistTrackerProps {
  bookings: Booking[];
}

const ChecklistTracker = ({ bookings }: ChecklistTrackerProps) => {
  const [stats, setStats] = useState<{ key: ChecklistKey; label: string; checked: number; total: number }[]>([]);

  const compute = useCallback(() => {
    const items = getAllChecklistKeys();
    const total = bookings.length;
    const result = items.map((item) => {
      let checked = 0;
      bookings.forEach((b) => {
        const state = getChecklistState(b.id);
        if (state[item.key]) checked++;
      });
      return { key: item.key, label: item.label, checked, total };
    });
    setStats(result);
  }, [bookings]);

  useEffect(() => {
    compute();
    const handler = () => compute();
    window.addEventListener("checklist-updated", handler);
    return () => window.removeEventListener("checklist-updated", handler);
  }, [compute]);

  const totalChecked = stats.reduce((s, i) => s + i.checked, 0);
  const totalPossible = stats.reduce((s, i) => s + i.total, 0);
  const overallPct = totalPossible > 0 ? Math.round((totalChecked / totalPossible) * 100) : 0;

  return (
    <div className="mt-8 rounded-xl border bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <CheckSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Checklist Progress</h2>
          <p className="text-sm text-muted-foreground">
            {totalChecked} of {totalPossible} items completed ({overallPct}%)
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {stats.map((s) => {
          const pct = s.total > 0 ? Math.round((s.checked / s.total) * 100) : 0;
          return (
            <div key={s.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{s.label}</span>
                <span className="text-muted-foreground">
                  {s.checked}/{s.total}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChecklistTracker;
