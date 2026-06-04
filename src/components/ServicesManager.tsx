import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  addService,
  renameService,
  removeService,
  setServiceEnabled,
  useAllServices,
} from "@/lib/services";
import { hasMappedScenarios } from "@/lib/services";
import { Plus, Pencil, Trash2, Check, X, Settings2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const ServicesManager = () => {
  const [services] = useAllServices();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Service name is required.");
      return;
    }
    const created = addService(trimmed);
    if (!created) {
      toast.error("A service with that name already exists.");
      return;
    }
    toast.success(`Added service: ${created.name}`);
    setNewName("");
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingValue(name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const ok = renameService(editingId, editingValue);
    if (!ok) {
      toast.error("Could not rename — name is empty or already in use.");
      return;
    }
    toast.success("Service renamed.");
    setEditingId(null);
    setEditingValue("");
  };

  const handleToggle = (id: string, name: string, enabled: boolean) => {
    setServiceEnabled(id, enabled);
    toast.success(`${name} is now ${enabled ? "enabled" : "disabled"}.`);
  };

  const handleDelete = (id: string, name: string) => {
    const ok = removeService(id);
    if (!ok) {
      toast.error("Seeded services can be disabled but not deleted.");
      return;
    }
    toast.success(`Removed ${name}.`);
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Services Management
        </CardTitle>
        <CardDescription>
          Add, rename, disable, or remove the services that appear in booking forms.
          Disabled services are hidden from selection but still display on existing bookings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New service name (e.g. Crisis and Case Management)"
            maxLength={120}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        </div>

        <div className="space-y-2">
          {services.map((s) => {
            const isEditing = editingId === s.id;
            const mapped = hasMappedScenarios(s.name);
            return (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEdit();
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      className="max-w-md"
                    />
                  ) : (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {s.seeded && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            s.enabled
                              ? "border-success/20 bg-success/10 text-xs text-success"
                              : "border-muted bg-muted text-xs text-muted-foreground"
                          }
                        >
                          {s.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        {!mapped && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-warning/30 bg-warning/10 text-xs text-warning"
                          >
                            <AlertTriangle className="h-3 w-3" /> No mapped scenarios
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={saveEdit} className="gap-1">
                        <Check className="h-3.5 w-3.5" /> Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="gap-1"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`svc-toggle-${s.id}`}
                          checked={s.enabled}
                          onCheckedChange={(v) => handleToggle(s.id, s.name, v)}
                          aria-label={`Toggle ${s.name}`}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(s.id, s.name)}
                        className="gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Rename
                      </Button>
                      {!s.seeded && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(s.id, s.name)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServicesManager;
