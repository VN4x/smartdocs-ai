import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDocument,
  getSignedUrl,
  getShareUrl,
  deleteDocument,
  updateDocument,
  listFolders,
  isPreviewable,
  isCurrentUserAdmin,
  formatBytes,
  extOf,
} from "@/lib/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Loader2,
  Pencil,
  Trash2,
  FileText,
  Printer,
  Send,
  Copy,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/documents/$id")({
  head: () => ({ meta: [{ title: "Document · Document Library" }] }),
  component: DetailPage,
  notFoundComponent: () => <p className="text-sm text-muted-foreground">Document not found.</p>,
  errorComponent: () => (
    <p className="text-sm text-destructive">Couldn't load this document.</p>
  ),
});

/** Escape a string for safe interpolation into raw HTML. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function DetailPage() {
  const { id } = useParams({ from: "/_authenticated/documents/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: doc, isLoading } = useQuery({
    queryKey: ["documents", id],
    queryFn: () => getDocument(id),
  });

  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin"],
    queryFn: isCurrentUserAdmin,
  });

  useEffect(() => {
    if (doc && isPreviewable(doc.mime_type, doc.original_ext)) {
      getSignedUrl(doc.file_path).then(setPreviewUrl).catch(() => setPreviewUrl(null));
    }
    if (doc?.thumbnail_path) {
      getSignedUrl(doc.thumbnail_path).then(setThumbUrl).catch(() => setThumbUrl(null));
    } else {
      setThumbUrl(null);
    }
  }, [doc]);

  async function download() {
    if (!doc) return;
    try {
      const url = await getSignedUrl(doc.file_path, true);
      window.open(url, "_blank");
    } catch {
      toast.error("Couldn't generate download link.");
    }
  }

  async function print() {
    if (!doc) return;
    setPrinting(true);
    try {
      const url = await getSignedUrl(doc.file_path);
      const isImage = (doc.mime_type ?? "").startsWith("image/");
      const win = window.open("", "_blank");
      if (!win) {
        toast.error("Allow pop-ups to print this document.");
        return;
      }
      // Escape any value interpolated into the raw HTML string to prevent
      // stored XSS via a maliciously named document.
      const safeUrl = encodeURI(url).replace(/"/g, "%22");
      const safeTitle = escapeHtml(doc.title);
      const body = isImage
        ? `<img src="${safeUrl}" onload="setTimeout(() => window.print(), 200)" style="max-width:100%;height:auto;display:block;margin:0 auto" />`
        : `<iframe src="${safeUrl}" onload="setTimeout(() => window.print(), 400)" style="border:0;width:100%;height:100vh"></iframe>`;
      win.document.write(
        `<!doctype html><html><head><title>${safeTitle}</title><meta charset="utf-8" /><style>html,body{margin:0;padding:0;height:100%}</style></head><body>${body}</body></html>`,
      );
      win.document.close();
    } catch {
      toast.error("Couldn't prepare the document for printing.");
    } finally {
      setPrinting(false);
    }
  }

  async function share() {
    if (!doc) return;
    setSharing(true);
    setCopied(false);
    try {
      const url = await getShareUrl(doc.file_path);
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        /* clipboard may be blocked; the dialog still shows the link */
      }
    } catch {
      toast.error("Couldn't create a share link.");
    } finally {
      setSharing(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy. Select and copy the link manually.");
    }
  }

  async function remove() {
    if (!doc) return;
    setBusy(true);
    try {
      await deleteDocument(doc);
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted.");
      navigate({ to: "/library" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!doc) return <p className="text-sm text-muted-foreground">Document not found.</p>;

  const ext = doc.original_ext || extOf(doc.file_name);

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/library">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to library
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{doc.title}</h1>
            <p className="text-sm text-muted-foreground">
              {doc.file_name} · {formatBytes(doc.file_size)}
              {ext ? <span className="uppercase"> · {ext}</span> : null}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
            <Pencil className="mr-1.5 h-4 w-4" /> {editing ? "Close" : "Edit"}
          </Button>
          <Button variant="outline" size="sm" onClick={print} disabled={printing}>
            {printing ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-1.5 h-4 w-4" />
            )}
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={share} disabled={sharing}>
            {sharing ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            Send
          </Button>
          <Button size="sm" onClick={download}>
            <Download className="mr-1.5 h-4 w-4" /> Download
          </Button>
          {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the file and its metadata. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={remove} disabled={busy}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}
        </div>
      </div>

      <Dialog open={!!shareUrl} onOpenChange={(open) => !open && setShareUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Private share link</DialogTitle>
            <DialogDescription>
              Anyone with this link can view the file. It works for 24 hours, then
              expires automatically. {copied ? "Copied to your clipboard." : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={shareUrl ?? ""} onFocus={(e) => e.target.select()} />
            <Button type="button" variant="outline" size="icon" onClick={copyShareUrl}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {editing ? (
        <EditForm
          doc={doc}
          onDone={async () => {
            await queryClient.invalidateQueries({ queryKey: ["documents"] });
            await queryClient.invalidateQueries({ queryKey: ["documents", id] });
            setEditing(false);
          }}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {thumbUrl && (
                <a href={thumbUrl} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={thumbUrl}
                    alt={`${doc.title} preview`}
                    className="w-full rounded-md border object-cover"
                  />
                </a>
              )}
              <Meta label="Tüüp (type)" value={doc.tuup} />
              <Meta label="Tellimuse kinnitus" value={doc.tellimuse_kinnitus} />
              <Meta label="Objekt (object)" value={doc.objekt} />
              <Meta label="Materjal (material)" value={doc.materjal} />
              <Meta label="Supplier" value={doc.supplier} />
              <Meta label="Date" value={doc.doc_date} />
              {doc.tags?.length ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tags</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {doc.tags.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {doc.description ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                  <p className="mt-1 whitespace-pre-wrap">{doc.description}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {isPreviewable(doc.mime_type, doc.original_ext) ? (
                previewUrl ? (
                  doc.mime_type?.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt={doc.title}
                      className="max-h-[600px] w-full rounded-md object-contain"
                    />
                  ) : (
                    <iframe
                      src={previewUrl}
                      title={doc.title}
                      className="h-[600px] w-full rounded-md border"
                    />
                  )
                ) : (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-3 p-12 text-center text-sm text-muted-foreground">
                  <FileText className="h-10 w-10" />
                  <p>No in-browser preview for this file type. Use Download to open it.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p>{value || "—"}</p>
    </div>
  );
}

function EditForm({
  doc,
  onDone,
}: {
  doc: NonNullable<Awaited<ReturnType<typeof getDocument>>>;
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: doc.title,
    description: doc.description ?? "",
    tuup: doc.tuup ?? "",
    tellimuse_kinnitus: doc.tellimuse_kinnitus ?? "",
    objekt: doc.objekt ?? "",
    materjal: doc.materjal ?? "",
    supplier: doc.supplier ?? "",
    doc_date: doc.doc_date ?? "",
    tags: (doc.tags ?? []).join(", "),
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDocument(doc.id, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        tuup: form.tuup.trim() || null,
        tellimuse_kinnitus: form.tellimuse_kinnitus.trim() || null,
        objekt: form.objekt.trim() || null,
        materjal: form.materjal.trim() || null,
        supplier: form.supplier.trim() || null,
        doc_date: form.doc_date || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Saved.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tüüp (type)</Label>
              <Input value={form.tuup} onChange={(e) => set("tuup", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tellimuse kinnitus</Label>
              <Input
                value={form.tellimuse_kinnitus}
                onChange={(e) => set("tellimuse_kinnitus", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Objekt (object)</Label>
              <Input value={form.objekt} onChange={(e) => set("objekt", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Materjal (material)</Label>
              <Input value={form.materjal} onChange={(e) => set("materjal", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.doc_date}
                onChange={(e) => set("doc_date", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags (comma separated)</Label>
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
