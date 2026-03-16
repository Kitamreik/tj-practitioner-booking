import { useState } from "react";
import { FileText, Image, Link2, Eye, EyeOff, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface VaultFile {
  id: string;
  name: string;
  type: "image" | "pdf" | "link";
  url: string;
  addedAt: string;
}

const ICON_MAP = {
  image: Image,
  pdf: FileText,
  link: Link2,
};

const FileVault = () => {
  const [files, setFiles] = useState<VaultFile[]>([
    { id: "v1", name: "Insurance Policy.pdf", type: "pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", addedAt: "2026-03-10" },
    { id: "v2", name: "Clinic Logo", type: "image", url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&q=80", addedAt: "2026-03-12" },
    { id: "v3", name: "Booking Guidelines", type: "link", url: "https://example.com/guidelines", addedAt: "2026-03-14" },
  ]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newFile, setNewFile] = useState({ name: "", type: "link" as VaultFile["type"], url: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePreview = (file: VaultFile) => {
    if (!revealed.has(file.id)) {
      toggleReveal(file.id);
      return;
    }
    setPreviewFile(file);
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setRevealed((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const validateAdd = () => {
    const errs: Record<string, string> = {};
    if (!newFile.name.trim()) errs.name = "Name is required";
    if (!newFile.url.trim()) errs.url = "URL is required";
    else if (!/^https?:\/\/.+/.test(newFile.url.trim())) errs.url = "Must be a valid URL";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = () => {
    if (!validateAdd()) return;
    const file: VaultFile = {
      id: crypto.randomUUID(),
      name: newFile.name.trim(),
      type: newFile.type,
      url: newFile.url.trim(),
      addedAt: new Date().toISOString().split("T")[0],
    };
    setFiles((prev) => [file, ...prev]);
    setNewFile({ name: "", type: "link", url: "" });
    setErrors({});
    setAddOpen(false);
  };

  const renderPreviewContent = (file: VaultFile) => {
    switch (file.type) {
      case "image":
        return <img src={file.url} alt={file.name} className="max-h-[70vh] w-full rounded-lg object-contain" />;
      case "pdf":
        return <iframe src={file.url} className="h-[70vh] w-full rounded-lg border" title={file.name} />;
      case "link":
        return (
          <div className="flex flex-col items-center gap-4 py-12">
            <Link2 className="h-12 w-12 text-primary" />
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all text-center">
              {file.url}
            </a>
          </div>
        );
    }
  };

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">File Vault</h2>
          <p className="text-sm text-muted-foreground">Click a file to reveal, click again to preview</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to File Vault</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newFile.name}
                  onChange={(e) => { setNewFile((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: "" })); }}
                  placeholder="e.g. Insurance Document"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newFile.type} onValueChange={(v) => setNewFile((p) => ({ ...p, type: v as VaultFile["type"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={newFile.url}
                  onChange={(e) => { setNewFile((p) => ({ ...p, url: e.target.value })); setErrors((p) => ({ ...p, url: "" })); }}
                  placeholder="https://..."
                  aria-invalid={!!errors.url}
                />
                {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
              </div>
              <Button onClick={handleAdd} className="w-full">Add File</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => {
          const isRevealed = revealed.has(file.id);
          const Icon = ICON_MAP[file.type];
          return (
            <div
              key={file.id}
              className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md"
            >
              {/* Obscured overlay */}
              {!isRevealed && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/80 backdrop-blur-md">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <EyeOff className="h-8 w-8" />
                    <span className="text-xs font-medium">Click to reveal</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => handlePreview(file)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{file.type} · {file.addedAt}</p>
                  </div>
                </div>
              </button>

              {isRevealed && (
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => toggleReveal(file.id)} className="rounded-md bg-card p-1.5 shadow-sm hover:bg-accent">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(file.id)} className="rounded-md bg-card p-1.5 shadow-sm hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {files.length === 0 && (
          <div className="col-span-full rounded-xl border bg-card p-12 text-center">
            <p className="text-muted-foreground">No files in the vault yet.</p>
          </div>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => { if (!open) setPreviewFile(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewFile && <span>{previewFile.name}</span>}
            </DialogTitle>
          </DialogHeader>
          {previewFile && renderPreviewContent(previewFile)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileVault;
