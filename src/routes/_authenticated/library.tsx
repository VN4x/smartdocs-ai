import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listDocuments, distinctValues, extOf, type DocumentRow } from "@/lib/documents";
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

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library · Document Library" }] }),
  component: LibraryPage,
});

const ALL = "__all__";

function LibraryPage() {
  const { data: docs = [], isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
  });

  const [search, setSearch] = useState("");
  const [tuup, setTuup] = useState(ALL);
  const [objekt, setObjekt] = useState(ALL);
  const [materjal, setMaterjal] = useState(ALL);
  const [supplier, setSupplier] = useState(ALL);

  const types = useMemo(() => distinctValues(docs, "tuup"), [docs]);
  const objects = useMemo(() => distinctValues(docs, "objekt"), [docs]);
  const materials = useMemo(() => distinctValues(docs, "materjal"), [docs]);
  const suppliers = useMemo(() => distinctValues(docs, "supplier"), [docs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      if (tuup !== ALL && d.tuup !== tuup) return false;
      if (objekt !== ALL && d.objekt !== objekt) return false;
      if (materjal !== ALL && d.materjal !== materjal) return false;
      if (supplier !== ALL && d.supplier !== supplier) return false;
      if (!q) return true;
      const haystack = [
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
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [docs, search, tuup, objekt, materjal, supplier]);

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
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${filtered.length} of ${docs.length} documents`}
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
