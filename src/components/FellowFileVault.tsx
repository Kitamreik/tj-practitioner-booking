import { useState, useEffect, useCallback } from "react";
import { FileText, Image, Link2, Trash2, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { filesApi, type BookingFile } from "@/lib/api";

const ICON_MAP = { image: Image, pdf: FileText, link: Link2 };

function getStorageKey(bookingId: string) {
  return `fellow-files-${bookingId}`;
}

function loadLocal(bookingId: string): BookingFile[] {
  try {
    const raw = localStorage.getItem(getStorageKey(bookingId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(bookingId: string, files: BookingFile[]) {
  localStorage.setItem(getStorageKey(bookingId), JSON.stringify(files));
}

interface FellowFileVaultProps {
  bookingId: string;
  canAdd?: boolean;
  canDelete?: boolean;
}

const FellowFileVault = ({ bookingId, canAdd = true, canDelete = false }: FellowFileVaultProps) => {
  const [files, setFiles] = useState<BookingFile[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<BookingFile | null>(null);
  const [newFile, setNewFile] = useState({ name: "", type: "link" as BookingFile["type"], url: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usingLocal, setUsingLocal] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const data = await filesApi.getByBooking(bookingId);
      setFiles(data);
      setUsingLocal(false);
    } catch {
      setFiles(loadLocal(bookingId));
      setUsingLocal(true);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const persist = (updated: BookingFile[]) => {
    setFiles(updated);
    if (usingLocal) saveLocal(bookingId, updated);
  };

  const handleDelete = async (id: string) => {
    try {
      if (!usingLocal) await filesApi.delete(id);
    } catch { /* fall through */ }
    persist(files.filter((f) => f.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    const type = isImage ? "image" : isPdf ? "pdf" : "link";
    const entry: BookingFile = {
      id: crypto.randomUUID(),
      name: file.name,
      type,
      url,
      addedAt: new Date().toISOString().split("T")[0],
      bookingId,
    };
    try {
      if (!usingLocal) {
        const created = await filesApi.create(entry);
        setFiles((prev) => [created, ...prev]);
      } else {
        persist([entry, ...files]);
      }
    } catch {
      persist([entry, ...files]);
    }
    setAddOpen(false);
  };

  const validateAdd = () => {
    const errs: Record<string, string> = {};
    if (!newFile.name.trim()) errs.name = "Name is required";
    if (!newFile.url.trim()) errs.url = "URL is required";
    else if (!/^https?:\/\/.+/.test(newFile.url.trim())) errs.url = "Must be a valid URL";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddLink = async () => {
    if (!validateAdd()) return;
    const entry: BookingFile = {
      id: crypto.randomUUID(),
      name: newFile.name.trim(),
      type: newFile.type,
      url: newFile.url.trim(),
      addedAt: new Date().toISOString().split("T")[0],
      bookingId,
    };
    try {
      if (!usingLocal) {
        const created = await filesApi.create(entry);
        setFiles((prev) => [created, ...prev]);
      } else {
        persist([entry, ...files]);
      }
    } catch {
      persist([entry, ...files]);
    }
    setNewFile({ name: "", type: "link", url: "" });
    setErrors({});
    setAddOpen(false);
  };

  const renderPreview = (file: BookingFile) => {
    switch (file.type) {
      case "image":
        return <img src={file.url} alt={file.name} className="max-h-[70vh] w-full rounded-lg object-contain" />;
      case "pdf":
        return <iframe src={file.url} className="h-[70vh] w-full rounded-lg border" title={file.name} />;
      case "link":
        return (
          <div className="flex flex-col items-center gap-4 py-12">
            <Link2 className="h-12 w-12 text-primary" />
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="break-all text-center text-primary underline">
              {file.url}
            </a>
          </div>
        );
    }
  };

  if (files.length === 0 && !canAdd) return null;

  return (
    <div className="mt-3 border-t pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          Files
        </p>
        {canAdd && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add File</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="upload" className="pt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1 gap-1">
                    <Upload className="h-3.5 w-3.5" /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex-1 gap-1">
                    <Link2 className="h-3.5 w-3.5" /> Link
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Choose file</Label>
                    <Input type="file" accept="image/*,.pdf" onChange={handleFileUpload} />
                  </div>
                </TabsContent>
                <TabsContent value="link" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newFile.name} onChange={(e) => { setNewFile((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: "" })); }} placeholder="File name" />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newFile.type} onValueChange={(v) => setNewFile((p) => ({ ...p, type: v as BookingFile["type"] }))}>
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
                    <Input value={newFile.url} onChange={(e) => { setNewFile((p) => ({ ...p, url: e.target.value })); setErrors((p) => ({ ...p, url: "" })); }} placeholder="https://..." />
                    {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
                  </div>
                  <Button onClick={handleAddLink} className="w-full">Add File</Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-1.5">
        {files.map((file) => {
          const Icon = ICON_MAP[file.type];
          return (
            <div key={file.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50">
              <button onClick={() => setPreviewFile(file)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-sm text-foreground">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{file.addedAt}</span>
              </button>
              {canDelete && (
                <button onClick={() => handleDelete(file.id)} className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!previewFile} onOpenChange={(open) => { if (!open) setPreviewFile(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && renderPreview(previewFile)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FellowFileVault;
