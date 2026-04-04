import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Trash2, Chrome, KeyRound } from "lucide-react";

export interface LoginAttempt {
  id: string;
  email: string;
  method: "google" | "local";
  success: boolean;
  timestamp: string;
  userAgent?: string;
}

const LOGIN_LOG_KEY = "login_attempts_log";

export function logLoginAttempt(attempt: Omit<LoginAttempt, "id" | "timestamp">) {
  const logs: LoginAttempt[] = JSON.parse(localStorage.getItem(LOGIN_LOG_KEY) || "[]");
  logs.unshift({
    ...attempt,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });
  // Keep last 100
  localStorage.setItem(LOGIN_LOG_KEY, JSON.stringify(logs.slice(0, 100)));
}

const LoginMonitor = () => {
  const [logs, setLogs] = useState<LoginAttempt[]>([]);

  useEffect(() => {
    setLogs(JSON.parse(localStorage.getItem(LOGIN_LOG_KEY) || "[]"));
  }, []);

  const clearLogs = () => {
    localStorage.removeItem(LOGIN_LOG_KEY);
    setLogs([]);
  };

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold text-foreground">Login Attempt Monitor</h2>
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
          <p className="text-muted-foreground">No login attempts recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {log.method === "google" ? (
                    <Chrome className="h-4 w-4 text-primary" />
                  ) : (
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.email || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.method === "google" ? "Google OAuth" : "Email/Password"} · {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant={log.success ? "default" : "destructive"} className={log.success ? "bg-primary/10 text-primary" : ""}>
                  {log.success ? "Success" : "Failed"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoginMonitor;
