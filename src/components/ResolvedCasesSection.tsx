import { Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useResolvedCases, reopenCase } from "@/lib/resolvedCases";
import { toast } from "sonner";

const ResolvedCasesSection = () => {
  const resolved = useResolvedCases();

  const handleReopen = (id: string) => {
    const entry = reopenCase(id);
    if (entry) toast.success(`Case for ${entry.booking.customer_name} pushed back into the bookings queue`);
  };

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Archive className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-bold text-foreground">Resolved Practice Cases</h2>
        <Badge variant="secondary">{resolved.length}</Badge>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Summaries of closed cases sent from the admin and fellow dashboards. Reviewing a case pushes it back into the active bookings queue with all information retained.
      </p>

      {resolved.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No resolved cases yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resolved.map((rc) => (
            <Card key={rc.booking.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {rc.booking.customer_name}
                    </h3>
                    <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                      Resolved
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rc.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    Closed {new Date(rc.resolvedAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => handleReopen(rc.booking.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Review Case
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResolvedCasesSection;
