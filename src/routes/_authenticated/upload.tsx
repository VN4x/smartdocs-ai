import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createDocument,
  ensureDocumentType,
  uploadFile,
  extOf,
  listDocuments,
  listDocumentTypes,
  distinctValues,
  formatBytes,
} from "@/lib/documents";
import { fetchDocumentFromUrl } from "@/lib/fetch-url.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { UploadCloud, Loader2, FileText, X, Link2 } from "lucide-react";

/** A file fetched server-side from a URL and already stored in the bucket. */
type RemoteFile = {
  path: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  original_ext: string | null;
};

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({ meta: [{ title: "Upload · Document Library" }] }),
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const { data: typeRows = [] } = useQuery({
    queryKey: ["document_types"],
    queryFn: listDocumentTypes,
  });

  const typeOptions = useMemo(() => typeRows.map((t) => t.name), [typeRows]);
  const objectOptions = useMemo(() => distinctValues(docs, "objekt"), [docs]);
  const materialOptions = useMemo(() => distinctValues(docs, "materjal"), [docs]);
  const supplierOptions = useMemo(() => distinctValues(docs, "supplier"), [docs]);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    tuup: "",
    tellimuse_kinnitus: "",
    objekt: "",
    materjal: "",
    supplier: "",
    doc_date: "",
    tags: "",
  });

  function pick(f: File | null) {
    setFile(f);
    if (f && !form.title) {
      setForm((s) => ({ ...s, title: f.name.replace(/\.[^.]+$/, "") }));
    }
  }

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please choose a file to upload.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    setSaving(true);
    try {
      const { path } = await uploadFile(file);
      if (form.tuup.trim()) await ensureDocumentType(form.tuup);
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const doc = await createDocument({
        title: form.title.trim(),
        description: form.description.trim() || null,
        tuup: form.tuup.trim() || null,
        tellimuse_kinnitus: form.tellimuse_kinnitus.trim() || null,
        objekt: form.objekt.trim() || null,
        materjal: form.materjal.trim() || null,
        supplier: form.supplier.trim() || null,
        doc_date: form.doc_date || null,
        tags,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
        original_ext: extOf(file.name) || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["document_types"] });
      toast.success("Document uploaded.");
      navigate({ to: "/documents/$id", params: { id: doc.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Upload document</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">File</CardTitle>
          </CardHeader>
          <CardContent>
            {file ? (
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  pick(e.dataTransfer.files?.[0] ?? null);
                }}
                className={`flex w-full flex-col items-center gap-2 rounded-md border-2 border-dashed p-8 text-center transition-colors ${
                  dragOver ? "border-primary bg-accent/40" : "border-input"
                }`}
              >
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Drag & drop or click to choose a file</span>
                <span className="text-xs text-muted-foreground">
                  PDF, DWG, DOC, XLS, TXT, XML, OSD — any type
                </span>
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Title" required>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
            </Field>
            <Field label="Tüüp (type)">
              <Input
                list="type-options"
                value={form.tuup}
                onChange={(e) => set("tuup", e.target.value)}
                placeholder="Choose or type a new type…"
              />
              <datalist id="type-options">
                {typeOptions.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tellimuse kinnitus (order conf.)">
                <Input
                  value={form.tellimuse_kinnitus}
                  onChange={(e) => set("tellimuse_kinnitus", e.target.value)}
                />
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  value={form.doc_date}
                  onChange={(e) => set("doc_date", e.target.value)}
                />
              </Field>
              <Field label="Objekt (object / project)">
                <Input
                  list="object-options"
                  value={form.objekt}
                  onChange={(e) => set("objekt", e.target.value)}
                />
                <datalist id="object-options">
                  {objectOptions.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              </Field>
              <Field label="Materjal (material)">
                <Input
                  list="material-options"
                  value={form.materjal}
                  onChange={(e) => set("materjal", e.target.value)}
                />
                <datalist id="material-options">
                  {materialOptions.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              </Field>
              <Field label="Supplier">
                <Input
                  list="supplier-options"
                  value={form.supplier}
                  onChange={(e) => set("supplier", e.target.value)}
                />
                <datalist id="supplier-options">
                  {supplierOptions.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              </Field>
              <Field label="Tags (comma separated)">
                <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} />
              </Field>
            </div>
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/library" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
