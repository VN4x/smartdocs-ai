import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  searchDocuments,
  getFilterOptions,
  listFolders,
  extOf,
  formatDocNumber,
  getSignedUrls,
  PAGE_SIZE,
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
import { Skeleton } from "@/components/ui/skeleton";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ViewMode = "large" | "small" | "list";

type LibrarySearch = {
  folder?: string;
  q?: string;
  tuup?: string;
  objekt?: string;
  materjal?: string;
  supplier?: string;
  page?: number;
};

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library · Document Library" }] }),
  validateSearch: (search: Record<string, unknown>): LibrarySearch => {
    const pageNum = Number(search.page);
    return {
      folder: typeof search.folder === "string" ? search.folder : undefined,
      q: str(search.q),
      tuup: str(search.tuup),
      objekt: str(search.objekt),
      materjal: str(search.materjal),
      supplier: str(search.supplier),
      page: Number.isFinite(pageNum) && pageNum > 1 ? Math.floor(pageNum) : undefined,
    };
  },
  component: LibraryPage,
});

const ALL = "__all__";

function LibraryPage() {
  const { t } = useT();
  const navigate = useNavigate({ from: "/library" });
  const { folder, q, tuup, objekt, materjal, supplier, page } = Route.useSearch();
  const currentPage = page ?? 1;

  const { data: folders = [] } = useQuery({ queryKey: ["folders"], queryFn: listFolders });

  // Local search box value for snappy typing; URL is updated debounced below.
  const [searchInput, setSearchInput] = useState(q ?? "");
  const [view, setView] = useState<ViewMode>("large");

  // Keep the input in sync when the URL changes externally (back/forward).
  useEffect(() => {
    setSearchInput(q ?? "");
  }, [q]);

  // Debounce URL writes so typing doesn't spam history; reset to page 1.
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = searchInput.trim() || undefined;
      if (next !== q) {
        navigate({ search: (prev: LibrarySearch) => ({ ...prev, q: next, page: undefined }) });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, q, navigate]);

  function setFilter(key: keyof LibrarySearch, value: string) {
    const next = value === ALL ? undefined : value;
    navigate({ search: (prev: LibrarySearch) => ({ ...prev, [key]: next, page: undefined }) });
  }

  function goToPage(p: number) {
    navigate({ search: (prev: LibrarySearch) => ({ ...prev, page: p > 1 ? p : undefined }) });
  }

  // Selected folder + all its descendant subfolders (ids passed to the server).
  const folderIds = useMemo(() => {
    if (!folder || folder === "unfiled") return null;
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
    return Array.from(ids);
  }, [folder, folders]);

  const folderName = useMemo(() => {
    if (folder === "unfiled") return t("sidebar.unfiled");
    if (folder) return folders.find((f) => f.id === folder)?.name ?? t("library.folder");
    return null;
  }, [folder, folders, t]);

  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: getFilterOptions,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: result,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: [
      "documents-search",
      { folder, folderIds, q, tuup, objekt, materjal, supplier, page: currentPage },
    ],
    queryFn: () =>
      searchDocuments({
        q,
        tuup,
        objekt,
        materjal,
        supplier,
        folderIds,
        unfiled: folder === "unfiled",
        page: currentPage,
      }),
    placeholderData: keepPreviousData,
  });

  const rows = result?.rows ?? [];
  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Batch signed URLs for the thumbnails on the current page.
  const thumbPaths = useMemo(
    () => Array.from(new Set(rows.map((d) => d.thumbnail_path).filter(Boolean) as string[])),
    [rows],
  );
  const { data: thumbUrls = {} } = useQuery({
    queryKey: ["thumb-urls", thumbPaths],
    queryFn: () => getSignedUrls(thumbPaths),
    enabled: thumbPaths.length > 0,
    staleTime: 50 * 60 * 1000,
  });

  const hasFilters = Boolean(tuup || objekt || materjal || supplier || searchInput.trim());

  const activeChips = useMemo(() => {
    const chips: Array<{ key: keyof LibrarySearch; label: string; value: string }> = [];
    if (q) chips.push({ key: "q", label: "", value: q });
    if (tuup) chips.push({ key: "tuup", label: t("filter.type"), value: tuup });
    if (objekt) chips.push({ key: "objekt", label: t("filter.object"), value: objekt });
    if (materjal) chips.push({ key: "materjal", label: t("filter.material"), value: materjal });
    if (supplier) chips.push({ key: "supplier", label: t("filter.supplier"), value: supplier });
    return chips;
  }, [q, tuup, objekt, materjal, supplier, t]);

  function removeChip(key: keyof LibrarySearch) {
    if (key === "q") setSearchInput("");
    navigate({ search: (prev: LibrarySearch) => ({ ...prev, [key]: undefined, page: undefined }) });
  }

  function clearFilters() {
    setSearchInput("");
    navigate({
      search: (prev: LibrarySearch) => ({
        folder: prev.folder,
        q: undefined,
        tuup: undefined,
        objekt: undefined,
        materjal: undefined,
        supplier: undefined,
        page: undefined,
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
            {isLoading ? t("common.loading") : t("library.total", { total })}
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
          {isFetching ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <FilterSelect
            label={t("filter.type")}
            allLabel={t("filter.allType")}
            value={tuup ?? ALL}
            onChange={(v) => setFilter("tuup", v)}
            options={filterOptions?.types ?? []}
          />
          <FilterSelect
            label={t("filter.object")}
            allLabel={t("filter.allObject")}
            value={objekt ?? ALL}
            onChange={(v) => setFilter("objekt", v)}
            options={filterOptions?.objects ?? []}
          />
          <FilterSelect
            label={t("filter.material")}
            allLabel={t("filter.allMaterial")}
            value={materjal ?? ALL}
            onChange={(v) => setFilter("materjal", v)}
            options={filterOptions?.materials ?? []}
          />
          <FilterSelect
            label={t("filter.supplier")}
            allLabel={t("filter.allSupplier")}
            value={supplier ?? ALL}
            onChange={(v) => setFilter("supplier", v)}
            options={filterOptions?.suppliers ?? []}
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
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {hasFilters ? t("library.noMatch") : t("library.empty")}
          </p>
          {!hasFilters ? (
            <Button asChild>
              <Link to="/upload">
                <Upload className="mr-1.5 h-4 w-4" /> {t("library.uploadDocument")}
              </Link>
            </Button>
          ) : null}
        </Card>
      ) : (
        <>
          {view === "list" ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((d) => (
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
              {rows.map((d) => (
                <DocCard
                  key={d.id}
                  doc={d}
                  compact={view === "small"}
                  thumbUrl={d.thumbnail_path ? thumbUrls[d.thumbnail_path] : undefined}
                />
              ))}
            </div>
          )}

          {pageCount > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> {t("library.prev")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("library.pageOf", { page: currentPage, pages: pageCount })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pageCount}
                onClick={() => goToPage(currentPage + 1)}
              >
                {t("library.next")} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </>
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
