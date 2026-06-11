import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listDocuments,
  listFolders,
  distinctValues,
  extOf,
  formatDocNumber,
  getSignedUrls,
  type DocumentRow,
} from "@/lib/documents";
import { useT } from "@/lib/i18n";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Search,
  FileText,
  Upload,
  X,
  Loader2,
  LayoutGrid,
  Grid2x2,
  List as ListIcon,
} from "lucide-react";

type ViewMode = "large" | "small" | "list";

type LibrarySearch = {
  folder?: string;
  q?: string;
  tuup?: string;
  objekt?: string;
  materjal?: string;
  supplier?: string;
};

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library · Document Library" }] }),
  validateSearch: (search: Record<string, unknown>): LibrarySearch => ({
    folder: typeof search.folder === "string" ? search.folder : undefined,
    q: str(search.q),
    tuup: str(search.tuup),
    objekt: str(search.objekt),
    materjal: str(search.materjal),
    supplier: str(search.supplier),
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
  const { t } = useT();
  const navigate = useNavigate({ from: "/library" });
  const { folder, q, tuup, objekt, materjal, supplier } = Route.useSearch();

  const { data: docs = [], isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
  });
  const { data: folders = [] } = useQuery({ queryKey: ["folders"], queryFn: listFolders });

  // Local search box value for snappy typing; URL is updated debounced below.
  const [searchInput, setSearchInput] = useState(q ?? "");
  const [view, setView] = useState<ViewMode>("large");

  // Keep the input in sync when the URL changes externally (back/forward).
  useEffect(() => {
    setSearchInput(q ?? "");
  }, [q]);

  // Debounce URL writes so typing doesn't spam history.
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = searchInput.trim() || undefined;
      if (next !== q) navigate({ search: (prev) => ({ ...prev, q: next }) });
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, q, navigate]);

  function setFilter(key: keyof LibrarySearch, value: string) {
    const next = value === ALL ? undefined : value;
    navigate({ search: (prev) => ({ ...prev, [key]: next }) });
  }

  const types = useMemo(() => distinctValues(docs, "tuup"), [docs]);
  const objects = useMemo(() => distinctValues(docs, "objekt"), [docs]);
  const materials = useMemo(() => distinctValues(docs, "materjal"), [docs]);
  const suppliers = useMemo(() => distinctValues(docs, "supplier"), [docs]);

  const folderName = useMemo(() => {
    if (folder === "unfiled") return t("sidebar.unfiled");
    if (folder) return folders.find((f) => f.id === folder)?.name ?? t("library.folder");
    return null;
  }, [folder, folders, t]);

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
    const query = normalize(searchInput.trim());
    return scoped.filter((d) => {
      if (tuup && d.tuup !== tuup) return false;
      if (objekt && d.objekt !== objekt) return false;
      if (materjal && d.materjal !== materjal) return false;
      if (supplier && d.supplier !== supplier) return false;
      if (!query) return true;
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
      return haystack.includes(query);
    });
  }, [scoped, searchInput, tuup, objekt, materjal, supplier]);

  // Batch signed URLs for every thumbnail in the dataset (stable across filters).
  const thumbPaths = useMemo(
    () => Array.from(new Set(docs.map((d) => d.thumbnail_path).filter(Boolean) as string[])),
    [docs],
  );
  const { data: thumbUrls = {} } = useQuery({
    queryKey: ["thumb-urls", thumbPaths],
    queryFn: () => getSignedUrls(thumbPaths),
    enabled: thumbPaths.length > 0,
    staleTime: 50 * 60 * 1000,
  });

  const hasFilters = Boolean(tuup || objekt || materjal || supplier || searchInput.trim());

  function clearFilters() {
    setSearchInput("");
    navigate({
      search: (prev) => ({
        folder: prev.folder,
        q: undefined,
        tuup: undefined,
        objekt: undefined,
        materjal: undefined,
        supplier: undefined,
      }),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {folderName ?? t("library.documents")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? t("common.loading")
              : t("library.count", { filtered: filtered.length, total: scoped.length })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as ViewMode)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="large" aria-label={t("library.largeThumbs")}>
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="small" aria-label={t("library.smallThumbs")}>
              <Grid2x2 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label={t("library.numberedList")}>
              <ListIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button asChild>
            <Link to="/upload">
              <Upload className="mr-1.5 h-4 w-4" /> {t("library.uploadDocument")}
            </Link>
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("library.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <FilterSelect
            label={t("filter.type")}
            allLabel={t("filter.allType")}
            value={tuup ?? ALL}
            onChange={(v) => setFilter("tuup", v)}
            options={types}
          />
          <FilterSelect
            label={t("filter.object")}
            allLabel={t("filter.allObject")}
            value={objekt ?? ALL}
            onChange={(v) => setFilter("objekt", v)}
            options={objects}
          />
          <FilterSelect
            label={t("filter.material")}
            allLabel={t("filter.allMaterial")}
            value={materjal ?? ALL}
            onChange={(v) => setFilter("materjal", v)}
            options={materials}
          />
          <FilterSelect
            label={t("filter.supplier")}
            allLabel={t("filter.allSupplier")}
            value={supplier ?? ALL}
            onChange={(v) => setFilter("supplier", v)}
            options={suppliers}
          />
        </div>
        {hasFilters ? (
          <Button variant="ghost" size="sm" className="mt-3" onClick={clearFilters}>
            <X className="mr-1.5 h-4 w-4" /> {t("library.clearFilters")}
          </Button>
        ) : null}
      </Card>

      {error ? (
        <Card className="p-8 text-center text-sm text-destructive">{t("library.loadError")}</Card>
      ) : isLoading ? (
        <Card className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {docs.length === 0 ? t("library.empty") : t("library.noMatch")}
          </p>
          {docs.length === 0 ? (
            <Button asChild>
              <Link to="/upload">
                <Upload className="mr-1.5 h-4 w-4" /> {t("library.uploadDocument")}
              </Link>
            </Button>
          ) : null}
        </Card>
      ) : view === "list" ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <DocRow key={d.id} doc={d} />
          ))}
        </div>
      ) : (
        <div
          className={
            view === "small"
              ? "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {filtered.map((d) => (
            <DocCard
              key={d.id}
              doc={d}
              compact={view === "small"}
              thumbUrl={d.thumbnail_path ? thumbUrls[d.thumbnail_path] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  allLabel,
  value,
  onChange,
  options,
}: {
  label: string;
  allLabel: string;
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
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Thumb({ url, title, compact }: { url: string; title: string; compact: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div
      className={
        "overflow-hidden rounded-md border bg-muted " + (compact ? "aspect-[4/3]" : "aspect-video")
      }
    >
      <img
        src={url}
        alt={title}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function DocCard({
  doc,
  compact = false,
  thumbUrl,
}: {
  doc: DocumentRow;
  compact?: boolean;
  thumbUrl?: string;
}) {
  const ext = doc.original_ext || extOf(doc.file_name);
  return (
    <Link to="/documents/$id" params={{ id: doc.id }}>
      <Card
        className={
          "flex h-full flex-col transition-colors hover:border-primary/50 hover:bg-accent/40 " +
          (compact ? "gap-2 p-3" : "gap-3 p-4")
        }
      >
        {thumbUrl ? <Thumb url={thumbUrl} title={doc.title} compact={compact} /> : null}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
              #{formatDocNumber(doc.doc_number)}
            </Badge>
            <span className={"truncate font-medium" + (compact ? " text-sm" : "")} title={doc.title}>
              {doc.title}
            </span>
          </div>
          {ext && !compact ? (
            <Badge variant="secondary" className="shrink-0 uppercase">
              {ext}
            </Badge>
          ) : null}
        </div>
        {!compact && (
          <div className="flex flex-wrap gap-1.5 text-xs">
            {doc.tuup ? <Badge variant="outline">{doc.tuup}</Badge> : null}
            {doc.objekt ? <Badge variant="outline">{doc.objekt}</Badge> : null}
            {doc.materjal ? <Badge variant="outline">{doc.materjal}</Badge> : null}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{doc.supplier || "—"}</span>
          <span className="shrink-0">
            {doc.doc_date ?? new Date(doc.created_at).toLocaleDateString()}
          </span>
        </div>
      </Card>
    </Link>
  );
}

function DocRow({ doc }: { doc: DocumentRow }) {
  const ext = doc.original_ext || extOf(doc.file_name);
  return (
    <Link to="/documents/$id" params={{ id: doc.id }}>
      <Card className="flex items-center gap-3 px-3 py-2 transition-colors hover:border-primary/50 hover:bg-accent/40">
        <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
          #{formatDocNumber(doc.doc_number)}
        </Badge>
        <FileText className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium" title={doc.title}>
          {doc.title}
        </span>
        {ext ? (
          <span className="shrink-0 text-[10px] uppercase text-muted-foreground">{ext}</span>
        ) : null}
      </Card>
    </Link>
  );
}
