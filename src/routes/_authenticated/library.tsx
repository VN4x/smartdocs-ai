import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listDocuments,
  listFolders,
  distinctValues,
  extOf,
  type DocumentRow,
} from "@/lib/documents";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, FileText, Upload, X, Loader2 } from "lucide-react";

type LibrarySearch = { folder?: string };

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library · Document Library" }] }),
  validateSearch: (search: Record<string, unknown>): LibrarySearch => ({
    folder: typeof search.folder === "string" ? search.folder : undefined,
  }),
  component: LibraryPage,
});


const ALL = "__all__";

/** Lowercase + strip diacritics so "tuup" matches "Tüüp", "soon" matches "söön", etc. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function LibraryPage() {
  const { folder } = Route.useSearch();
  const { data: docs = [], isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
  });
  const { data: folders = [] } = useQuery({ queryKey: ["folders"], queryFn: listFolders });

  const [search, setSearch] = useState("");
  const [tuup, setTuup] = useState(ALL);
  const [objekt, setObjekt] = useState(ALL);
  const [materjal, setMaterjal] = useState(ALL);
  const [supplier, setSupplier] = useState(ALL);

  const types = useMemo(() => distinctValues(docs, "tuup"), [docs]);
  const objects = useMemo(() => distinctValues(docs, "objekt"), [docs]);
  const materials = useMemo(() => distinctValues(docs, "materjal"), [docs]);
  const suppliers = useMemo(() => distinctValues(docs, "supplier"), [docs]);

  const folderName = useMemo(() => {
    if (folder === "unfiled") return "Unfiled";
    if (folder) return folders.find((f) => f.id === folder)?.name ?? "Folder";
    return null;
  }, [folder, folders]);

  // Selected folder + all its descendant subfolders.
  const folderScope = useMemo(() => {
    if (!folder || folder === "unfiled") return new Set<string>();
    const childrenOf = new Map<string, string[]>();
    for (const f of folders) {
      if (f.parent_id) {
        const arr = childrenOf.get(f.parent_id) ?? [];
        arr.push(f.id);
        childrenOf.set(f.parent_id, arr);
      }
    }
    const ids = new Set<string>();
    const stack = [folder];
    while (stack.length) {
      const id = stack.pop()!;
      if (ids.has(id)) continue;
      ids.add(id);
      for (const c of childrenOf.get(id) ?? []) stack.push(c);
    }
    return ids;
  }, [folder, folders]);

  // Documents scoped to the selected folder (before search/metadata filters).
  const scoped = useMemo(() => {
    if (folder === "unfiled") return docs.filter((d) => !d.folder_id);
    if (folder) return docs.filter((d) => d.folder_id && folderScope.has(d.folder_id));
    return docs;
  }, [docs, folder, folderScope]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return scoped.filter((d) => {
      if (tuup !== ALL && d.tuup !== tuup) return false;
      if (objekt !== ALL && d.objekt !== objekt) return false;
      if (materjal !== ALL && d.materjal !== materjal) return false;
      if (supplier !== ALL && d.supplier !== supplier) return false;
      if (!q) return true;
      const haystack = normalize(
        [
          d.title,
          d.description,
          d.tuup,
          d.tellimuse_kinnitus,
          d.objekt,
          d.materjal,
          d.supplier,
          d.file_name,
          ...(d.tags ?? []),
        ]
          .filter(Boolean)
          .join(" "),
      );
      return haystack.includes(q);
    });
  }, [scoped, search, tuup, objekt, materjal, supplier]);



  const hasFilters =
    tuup !== ALL || objekt !== ALL || materjal !== ALL || supplier !== ALL || search.trim();

  function clearFilters() {
    setSearch("");
    setTuup(ALL);
    setObjekt(ALL);
    setMaterjal(ALL);
    setSupplier(ALL);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{folderName ?? "Documents"}</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${filtered.length} of ${scoped.length} documents`}
          </p>
        </div>

        <Button asChild>
          <Link to="/upload">
            <Upload className="mr-1.5 h-4 w-4" /> Upload document
          </Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, supplier, object, material, tags…"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <FilterSelect label="Type" value={tuup} onChange={setTuup} options={types} />
          <FilterSelect label="Object" value={objekt} onChange={setObjekt} options={objects} />
          <FilterSelect label="Material" value={materjal} onChange={setMaterjal} options={materials} />
          <FilterSelect label="Supplier" value={supplier} onChange={setSupplier} options={suppliers} />
        </div>
        {hasFilters ? (
          <Button variant="ghost" size="sm" className="mt-3" onClick={clearFilters}>
            <X className="mr-1.5 h-4 w-4" /> Clear filters
          </Button>
        ) : null}
      </Card>

      {error ? (
        <Card className="p-8 text-center text-sm text-destructive">
          Couldn't load documents. Please refresh.
        </Card>
      ) : isLoading ? (
        <Card className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {docs.length === 0
              ? "No documents yet. Upload your first one."
              : "No documents match your filters."}
          </p>
          {docs.length === 0 ? (
            <Button asChild>
              <Link to="/upload">
                <Upload className="mr-1.5 h-4 w-4" /> Upload document
              </Link>
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DocCard key={d.id} doc={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DocCard({ doc }: { doc: DocumentRow }) {
  const ext = doc.original_ext || extOf(doc.file_name);
  return (
    <Link to="/documents/$id" params={{ id: doc.id }}>
      <Card className="flex h-full flex-col gap-3 p-4 transition-colors hover:border-primary/50 hover:bg-accent/40">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate font-medium" title={doc.title}>
              {doc.title}
            </span>
          </div>
          {ext ? (
            <Badge variant="secondary" className="shrink-0 uppercase">
              {ext}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {doc.tuup ? <Badge variant="outline">{doc.tuup}</Badge> : null}
          {doc.objekt ? <Badge variant="outline">{doc.objekt}</Badge> : null}
          {doc.materjal ? <Badge variant="outline">{doc.materjal}</Badge> : null}
        </div>
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{doc.supplier || "—"}</span>
          <span>{doc.doc_date ?? new Date(doc.created_at).toLocaleDateString()}</span>
        </div>
      </Card>
    </Link>
  );
}
