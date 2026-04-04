import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, ChevronDown, ChevronUp, User, Mail, Phone, Calendar } from "lucide-react";

interface IntakeRecord {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  service: string;
  practitioner: string;
  preferredDate: string;
  urgency: string;
  referralSource: string;
  concerns: string;
  goals: string;
  submittedAt: string;
}

const urgencyColor: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-primary/10 text-primary border-primary/20",
  High: "bg-destructive/10 text-destructive border-destructive/20",
};

const IntakeRecordsViewer = () => {
  const [records, setRecords] = useState<IntakeRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("practicum_intakes") || "[]");
    setRecords(stored);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "practicum_intakes") {
        setRecords(JSON.parse(e.newValue || "[]"));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (records.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-bold text-foreground">Practicum Intake Records</h2>
        <Badge variant="secondary" className="ml-1">{records.length}</Badge>
      </div>

      <div className="space-y-3">
        {records.map((r) => {
          const expanded = expandedId === r.id;
          return (
            <Card key={r.id} className="transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-heading text-sm font-semibold text-foreground">{r.fullName}</span>
                      <Badge variant="outline" className={urgencyColor[r.urgency] || ""}>{r.urgency}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.service}{r.practitioner ? ` · ${r.practitioner}` : ""}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setExpandedId(expanded ? null : r.id)}>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                {expanded && (
                  <div className="mt-4 space-y-3 border-t pt-4 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-foreground">{r.email}</span>
                      </div>
                      {r.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-foreground">{r.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-foreground">{new Date(r.preferredDate).toLocaleString()}</span>
                      </div>
                      {r.referralSource && (
                        <div className="text-muted-foreground">Referral: {r.referralSource}</div>
                      )}
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Primary Concerns</p>
                      <p className="text-foreground">{r.concerns}</p>
                    </div>
                    {r.goals && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Goals</p>
                        <p className="text-foreground">{r.goals}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Submitted {new Date(r.submittedAt).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default IntakeRecordsViewer;
