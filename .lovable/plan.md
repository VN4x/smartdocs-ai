# Library upgrade: quick wins + server-side search & pagination

Two bundles, building on the existing code. Drag-and-drop and the heavier items (version history, audit log) are intentionally out of scope.

## Bundle A — Quick wins (Low effort)

### A1. Wire i18n everywhere

All translation keys already exist in `i18n-messages.ts` (auth.*, sidebar.*, library.*, filter.*) in all 5 languages — no new keys needed. This is purely swapping hardcoded English for `t()` calls.

- `src/routes/auth.tsx` — add `useT()`, replace the ~10 literals (Team access, Check your email, Work email, Send login link, domain warnings, toasts) with existing `auth.*` keys.
- `src/components/folders-sidebar.tsx` — add `useT()`, replace literals with existing `sidebar.*` / `toast.*` keys.
- `src/routes/_authenticated/library.tsx` — add `useT()`, replace headings, counts, view-toggle labels, filter labels, empty/error states with existing `library.*` / `filter.*` keys.

### A2. Thumbnails in the library grid

- After a page of documents loads, collect non-null `thumbnail_path` values and batch-request signed URLs via `supabase.storage.from("documents").createSignedUrls(paths, 3600)` (one round-trip), keyed in a small `useQuery`.
- `DocCard` (large + small) renders the thumbnail `<img>` with `loading="lazy"` and an aspect-ratio frame; falls back to the current file-type icon/badge when there's no thumbnail or the image fails to load.
- `DocRow` (list view) keeps the icon, unchanged.

### A3. Filters in URL state

Extend the existing `?folder=` search-param pattern so type/object/material/supplier/search/page persist in the URL (shareable, survive refresh, back-button friendly).

- Expand `validateSearch` to include `q`, `tuup`, `objekt`, `materjal`, `supplier`, `page` (all optional, with defaults).
- Replace the `useState` filter vars with `Route.useSearch()` + `useNavigate()` updates (`navigate({ search: prev => ({...prev, ...}) })`).
- The search box updates the URL debounced (~300ms) so typing doesn't spam history.

## Bundle B — Skip now, buld in future phsaes Server-side search + pagination (Medium effort)

Removes the in-memory 1000-row cap and the client-side filtering loop. The browser client calls Postgres functions directly (RLS already lets authenticated users read documents).

### B1. Database migration

- Enable `unaccent` + an `IMMUTABLE` wrapper `public.f_unaccent(text)` (required so it can be used in a generated column).
- Add a generated `STORED` `tsvector` column `search_tsv` on `documents` covering title, supplier, objekt, materjal, description, file_name, and tags, all run through `f_unaccent` so "tuup" matches "tüüp" (preserves today's diacritic-insensitive behavior).
- `CREATE INDEX ... USING GIN(search_tsv)`.
- `search_documents(...)` function (`SECURITY INVOKER`, so RLS still applies) taking query text, the four filter values, a folder-id array, an `unfiled` flag, plus `limit`/`offset`; returns a JSON object `{ rows, total }` (page rows + total match count for the pager). Query text is unaccented server-side before matching.
- `document_filter_options()` function returning the distinct type/object/material/supplier value lists for the dropdowns (these can no longer be derived from a single page).
- `GRANT EXECUTE` on both functions to `authenticated`.

### B2. Library data layer (`src/lib/documents.ts`)

- Add `searchDocuments(params)` → `supabase.rpc("search_documents", ...)`, returning `{ rows, total }`.
- Add `getFilterOptions()` → `supabase.rpc("document_filter_options")`.
- Keep `listDocuments` for any other caller, but the library page stops using it.

### B3. Library page rewrite of the data flow

- Folder scope: the client still resolves the selected folder + its descendant ids (existing `folderScope` logic) and passes that id array (or the `unfiled` flag) into `searchDocuments`.
- `useQuery` keyed on all search params (`["documents", folder, q, tuup, objekt, materjal, supplier, page]`) calls `searchDocuments`; filter dropdowns come from a separate `getFilterOptions` query.
- Pagination UI: fixed page size (60), Prev/Next + "Page X of Y" and total count, driven by the `page` URL param. The old `normalize()`/in-memory `filtered` block is removed.

## Out of scope (deferred per decision)

Sidebar drag-and-drop (the "Move to…" menu stays), version history, audit log, admin panel, bulk actions, ZIP export, QR sheet. Bundle B

## Technical notes

- Bundle A is independent and can ship first; thumbnails and URL-state both touch `library.tsx`, so they're done in one pass with the i18n swap.
- Bundle B is not built now, will later in future phases as changes how the library fetches data; A2/A3 are written against the paginated result shape so the two bundles compose cleanly.
- `search_documents` uses `websearch_to_tsquery('simple', f_unaccent(q))` for forgiving multi-word queries; empty `q` returns all (filtered) rows ordered by `created_at desc`.
- No change to RLS or grants on the `documents` table itself; only the two new functions get `EXECUTE` grants.
- Generated `tsvector` backfills automatically for existing rows when the column is added.