import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export interface ProfileEdit {
  id: string;
  email: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

const PROFILE_EDITS_KEY = "profile_edits_log";

export function logProfileEdit(edit: Omit<ProfileEdit, "id" | "timestamp">) {
  const logs: ProfileEdit[] = JSON.parse(localStorage.getItem(PROFILE_EDITS_KEY) || "[]");
  logs.unshift({
    ...edit,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(PROFILE_EDITS_KEY, JSON.stringify(logs.slice(0, 100)));
}

const ProfileEditLog = () => {
  const [logs, setLogs] = useState<ProfileEdit[]>([]);

  useEffect(() => {
    setLogs(JSON.parse(localStorage.getItem(PROFILE_EDITS_KEY) || "[]"));
  }, []);

  const clearLogs = () => {
    localStorage.removeItem(PROFILE_EDITS_KEY);
    setLogs([]);
  };

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pencil className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold text-foreground">Profile Edit History</h2>
          <Badge variant="secondary">{logs.length}</Badge>
        </div>
        {logs.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearLogs} className="gap-1 text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-muted-foreground">No profile edits recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Changed <Badge variant="outline" className="mx-1 text-[10px]">{log.field}</Badge>
                      from "{log.oldValue}" to "{log.newValue}"
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileEditLog;
