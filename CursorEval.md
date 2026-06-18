# CursorEval: Rebuilding the Document Library in Go (Self-Hosted)

**Date:** 2026-06-11  
**Scope:** Evaluate rebuilding this repository’s document management system in Go, with emphasis on self-hosting, frontend strategy, and PocketBase as a backend option.

---

## 1. Executive summary

| Question | Recommendation |
|----------|----------------|
| **Build from scratch in Go?** | **No for the full stack.** A custom Go backend is justified only if you need deep control (compliance, unusual workflows, no third-party runtime). For this app’s size, a **hybrid** approach wins. |
| **Use an admin/dashboard UI instead of a custom frontend?** | **No for end users.** Admin UIs (PocketBase admin, Directus, etc.) are operator tools, not a team document library. Keep a **thin custom UI** for upload/search/preview; optionally use PocketBase admin for schema tweaks and user management. |
| **PocketBase for self-hosted lightweight DMS?** | **Yes — best default for this project.** PocketBase covers auth, SQLite DB, file storage, REST/realtime API, record rules, hooks, and single-binary deployment. Pair it with a small custom frontend (port existing React UI or use HTMX). |
| **Preferred architecture** | **PocketBase + custom frontend** (reuse current React/shadcn UI against PocketBase SDK), with Go hooks/extensions only where PocketBase is insufficient (domain-gated signup, SSRF-safe URL import, doc numbering). |

**Bottom line:** For a simple, self-hosted team document library like this one, **do not rewrite everything in Go from scratch**. Use **PocketBase as the backend** and invest effort in the **user-facing UI** and a few **Go hooks**. Pure Go-from-scratch only makes sense if PocketBase’s constraints (SQLite, extension model) are unacceptable.

---

## 2. What we are rebuilding

The current app (`tanstack_start_ts`) is a **team document library** for Kvaliteetaken, not a generic CMS.

### 2.1 Core features (from codebase)

| Area | Current implementation |
|------|------------------------|
| **Documents** | Metadata: title, description, Estonian fields (`tuup`, `tellimuse_kinnitus`, `objekt`, `materjal`), supplier, date, tags, auto `doc_number`, file + optional thumbnail |
| **Storage** | Supabase Storage bucket `documents`, signed URLs for preview/download/share |
| **Library UI** | Grid/list views, full-text-style client search, filters by metadata, folder scoping |
| **Folders** | Nested hierarchy, sidebar, move documents/folders, admin-only folder delete |
| **Upload** | Drag-and-drop, optional preview image, URL import (server-side fetch with SSRF checks) |
| **Detail view** | Preview PDF/images, edit metadata, download, 24h share link, print |
| **Auth** | Magic link only, domain-gated (`@kvaliteetaken.ee`), no public signup |
| **Roles** | All authenticated users: view/upload/edit; **admins only**: delete documents/folders |
| **i18n** | 5 languages (et, en, ru, fi, lv) |
| **Infra today** | TanStack Start + React + shadcn/ui + Supabase (Postgres + Auth + Storage + RLS) |

### 2.2 Non-functional requirements implied by the product

- **Self-hosted** — single machine or small VPS, minimal ops
- **Small team** — tens of users, thousands of documents, not enterprise scale
- **Shared library** — intentional open read/write within the org (except delete)
- **Security-sensitive** — domain auth, SSRF on URL import, XSS on print, admin-only deletes
- **Lightweight** — low memory, easy backup, no Kubernetes

---

## 3. Architecture options compared

### Option A — PocketBase + custom frontend (recommended)

```
┌─────────────────────────────────────────────────────────┐
│  Browser: React (existing UI) or HTMX + templ         │
│  - Library, upload, preview, folders, i18n              │
└──────────────────────────┬──────────────────────────────┘
                           │ PocketBase JS SDK / REST
┌──────────────────────────▼──────────────────────────────┐
│  PocketBase (single Go binary)                          │
│  - Collections: documents, folders, document_types,     │
│    user_roles                                           │
│  - File storage (local disk)                            │
│  - Auth (OTP/magic link)                                │
│  - Collection API rules (role-based)                    │
│  - Go hooks: domain gate, doc_number, URL fetch, etc.   │
└─────────────────────────────────────────────────────────┘
```

**Pros**

- Single ~15 MB binary, SQLite file + `./pb_data` — ideal self-host
- Auth, files, CRUD, admin UI included
- Collection rules replace Supabase RLS
- Go hooks for custom logic (same language as a “full Go” backend)
- Backup = copy `pb_data` directory
- Realtime subscriptions if you want live library updates later

**Cons**

- SQLite limits concurrent write throughput (fine for this use case)
- Nested folders need modeling (`parent` relation on `folders` — same as today)
- PocketBase admin UI is **not** a replacement for the library UI
- URL-import SSRF logic must live in a hook or small sidecar service
- Magic-link + domain allowlist requires a hook (see §5)

**Fit score: 9/10** for this project.

---

### Option B — Custom Go backend + custom frontend

```
React/HTMX UI  →  Go API (Fiber/Echo/Chi)  →  Postgres or SQLite  +  local disk/MinIO
```

**Stack candidates**

| Layer | Libraries |
|-------|-----------|
| HTTP | `chi`, `echo`, or `fiber` |
| DB | `sqlc` + SQLite (simple) or Postgres (if you outgrow SQLite) |
| Migrations | `goose` or `atlas` |
| Auth | `coreos/go-oidc`, custom magic-link, or `authelia` in front |
| Files | Local filesystem or MinIO (S3-compatible) |
| Frontend | Port existing React **or** `templ` + HTMX (Go-native, no Node in prod) |

**Pros**

- Full control, no framework ceiling
- Can embed static frontend in one binary (`embed.FS`)
- Easier to add odd integrations (AD/LDAP, internal ERP)

**Cons**

- You rebuild: auth flows, file upload pipeline, signed URLs, migrations, admin tooling
- Estimated **3–5×** effort vs PocketBase for equivalent features
- Ongoing security burden (auth, SSRF, path traversal on files)

**Fit score: 6/10** — good if PocketBase is ruled out, overkill otherwise.

---

### Option C — PocketBase/Go backend + off-the-shelf admin UI only

Examples: PocketBase admin, Directus, Strapi, Appwrite console.

**Verdict: insufficient for end users.**

These tools excel at **schema and user management**, not at:

- Branded library with Estonian metadata fields
- Thumbnail grids, print layouts, share links
- Folder sidebar tuned to document workflows
- i18n for field labels and navigation

Use admin UI **only** for operators (add document types, reset users). The team still needs the custom library UI.

**Fit score: 3/10** as the sole UI; **7/10** as a supplement.

---

### Option D — Full Supabase self-host (status quo, not Go)

Self-hosted Supabase (Docker) is viable but **heavy**: Postgres, GoTrue, Storage API, Kong, etc. The current codebase already targets this model via Lovable Cloud.

**Pros:** Minimal rewrite; keep React app.  
**Cons:** Not Go-centric; higher RAM (~2 GB+); more moving parts than PocketBase.

**Fit score: 7/10** if “rewrite in Go” is a soft preference; **4/10** if the goal is minimal self-host footprint.

---

## 4. Should the frontend be built from scratch?

| Approach | When to use | For this project |
|----------|-------------|------------------|
| **Reuse existing React + shadcn UI** | PocketBase or Go API with REST/SDK | **Best ROI** — UI is already polished; swap `documents.ts` Supabase calls for PocketBase SDK |
| **HTMX + Go templates (`templ`)** | Want zero Node in production, small team, simpler interactions | Good if you prefer one language; rewrite UI effort ~2–3 weeks |
| **PocketBase admin only** | Internal tools, CRUD prototypes | **Not acceptable** for document library UX |
| **Heavy CMS (Directus/Strapi)** | Marketing sites, content APIs | Overkill; fight the framework for file-centric UX |

**Recommendation:** **Do not rebuild the frontend from scratch** unless you explicitly want a Go-only stack (HTMX). Port the existing React app to PocketBase — the domain logic in `src/lib/documents.ts` maps cleanly to collections and file APIs.

---

## 5. PocketBase mapping (concrete)

### 5.1 Collections

| Collection | Fields (high level) | Notes |
|------------|---------------------|-------|
| `documents` | title, description, tuup, tellimuse_kinnitus, objekt, materjal, supplier, doc_date, tags (JSON), doc_number, folder (relation), file (file), thumbnail (file), uploaded_by (relation) | File fields replace `file_path` / `thumbnail_path` |
| `folders` | name, parent (self-relation), created_by | Same tree model as current `folders` table |
| `document_types` | name (unique) | Seed defaults from migration |
| `user_roles` | user (relation), role (`admin` \| `user`) | Or use PocketBase `authorized` record field patterns |

### 5.2 API rules (replace Supabase RLS)

```javascript
// documents — illustrative PocketBase rules
list/view:   @request.auth.id != ""
create:      @request.auth.id != ""
update:      @request.auth.id != ""
delete:      @request.auth.id != "" && user_roles.role = "admin"
```

(Exact syntax depends on whether roles live in a separate collection or auth record metadata.)

### 5.3 Logic that needs Go hooks

| Feature | Hook type | Why |
|---------|-----------|-----|
| Domain-gated magic link (`@kvaliteetaken.ee`) | `OnRecordBeforeAuthWithOTPRequest` or custom auth route | PocketBase does not ship domain allowlists |
| Auto `doc_number` sequence | `OnRecordBeforeCreate` on `documents` | Monotonic numbering |
| Admin bootstrap for allowlisted emails | `OnRecordAfterCreate` on `users` | Port `ensure_admin_for_email` |
| URL import (fetch remote file) | Custom route `/api/fetch-url` | SSRF protection; must block private IPs |
| Folder delete → unfile documents | `OnRecordBeforeDelete` on `folders` | Set `folder = null` on children |
| Optional: share link TTL | Custom route or hook | PocketBase files can generate tokens; tune expiry |

These hooks are **small Go files** — far less work than a full custom backend.

### 5.4 Features with good PocketBase parity

- File upload, thumbnails, download
- Magic link / OTP auth (SMTP config)
- Search/filter (client-side like today, or PocketBase filter syntax)
- Nested folders via self-relation
- Realtime library refresh (bonus vs current app)

### 5.5 PocketBase limitations to plan for

1. **SQLite** — one writer at a time; OK for team uploads, not for high concurrent write load.
2. **Full-text search** — weaker than Postgres `tsvector`; client-side search (as now) or add Meilisearch later.
3. **Complex print view** — stays in frontend (as today).
4. **Email** — you must configure SMTP on the host (same as any self-hosted auth).

---

## 6. Custom Go-from-scratch: what you would actually write

If you reject PocketBase, budget for these modules:

| Module | Complexity | Notes |
|--------|------------|-------|
| HTTP API + middleware | Medium | JWT/session after magic link |
| Magic link + domain gate | Medium | Email templates, token store |
| File storage service | Medium | UUID paths, MIME detection, size limits |
| Signed download URLs | Low–medium | HMAC tokens with expiry |
| Document CRUD + metadata | Low | Straightforward SQL |
| Folder tree + moves | Medium | Cycle detection (already in `documents.ts`) |
| Role checks | Low | Middleware |
| URL fetch (SSRF-safe) | Medium | Port `fetch-url.functions.ts` logic |
| Migrations + backups | Ongoing | PocketBase gives this free |
| Operator admin | Medium | Build or adopt something |

**Rough equivalence:** PocketBase path ≈ **collections + rules + 5–8 hooks + frontend port**; pure Go ≈ **above table + frontend port**.

---

## 7. Deployment comparison (self-host)

| | PocketBase | Custom Go | Self-host Supabase |
|--|------------|-----------|-------------------|
| **Processes** | 1 binary | 1 binary (+ optional MinIO) | 8+ containers |
| **RAM** | ~50–150 MB | ~50–200 MB | ~2 GB+ |
| **Disk** | SQLite + files in `pb_data` | DB + upload dir | Postgres volume + storage |
| **Backup** | Stop/copy `pb_data` | DB dump + files | Stack-specific |
| **TLS** | Reverse proxy (Caddy/nginx) | Same | Same |
| **Updates** | Replace binary, run migrations | Your pipeline | Compose pull |

For a **lightweight self-hosted DMS**, PocketBase wins on operational surface area.

---

## 8. Decision matrix

| Criterion (weight) | PocketBase + React | Go from scratch | Self-host Supabase |
|--------------------|--------------------|-----------------|---------------------|
| Time to production | ★★★★★ | ★★ | ★★★★ |
| Self-host simplicity | ★★★★★ | ★★★★ | ★★ |
| Go alignment | ★★★★ (PB is Go) | ★★★★★ | ★ |
| Feature parity | ★★★★ | ★★★★★ | ★★★★★ |
| Custom UI quality | ★★★★★ | ★★★★★ | ★★★★★ |
| Long-term flexibility | ★★★ | ★★★★★ | ★★★★ |
| Ops burden | ★★★★★ | ★★★ | ★★ |

---

## 9. Recommended implementation plan

### Phase 1 — PocketBase foundation

1. Define collections mirroring current schema (§5.1).
2. Configure SMTP for magic-link auth.
3. Implement collection API rules (authenticated CRUD, admin delete).
4. Add Go hooks: domain gate, `doc_number`, admin bootstrap, folder delete behavior.

### Phase 2 — Frontend port

1. Keep React + shadcn + TanStack Router (or simplify to Vite SPA).
2. Replace `@supabase/supabase-js` with `pocketbase` SDK in `documents.ts` and auth flow.
3. Map storage: `record.file` URLs instead of `createSignedUrl`.
4. Reimplement URL import via custom PocketBase route calling SSRF-safe fetcher.

### Phase 3 — Hardening & ops

1. Caddy/nginx reverse proxy with TLS.
2. Nightly backup of `pb_data`.
3. Re-run security checks (XSS on print, SSRF, auth bypass).
4. Optional: keep PocketBase admin behind VPN for operator tasks only.

### Phase 4 (optional) — Go extraction

If PocketBase limits are hit (e.g. need Postgres, LDAP, advanced search):

- Extract only the bottleneck into a Go microservice.
- Or migrate to custom Go API while keeping the same React UI contract.

---

## 10. When to choose pure Go instead of PocketBase

Choose **custom Go from scratch** if:

- Compliance requires Postgres/Audit on every read
- You need LDAP/SSO beyond what hooks provide
- Expected scale exceeds SQLite comfort (many concurrent writers, >100 GB metadata queries)
- PocketBase’s license or roadmap is a blocker (unlikely for internal DMS)
- You want a single static binary with **embedded HTMX UI** and no JavaScript toolchain

Otherwise, **PocketBase is the rational default**.

---

## 11. Final answers (direct)

1. **Would I build a similar project in Go?**  
   **Partially.** The backend should be Go via **PocketBase** (or a thin custom Go API), not a greenfield rewrite of auth/storage/CRUD.

2. **From scratch or use a dashboard UI?**  
   **Neither alone.** Use a **custom end-user UI** (port the existing one) plus optionally **PocketBase admin** for operators. A dashboard-only product will not match the library experience.

3. **PocketBase for self-hosted simple lightweight DMS?**  
   **Yes.** It matches document + metadata + files + team auth + roles + single-binary deploy. Add hooks for domain auth, numbering, and URL import.

4. **Single best path:**  
   **PocketBase backend + ported React frontend + Go hooks for business rules** — best balance of Go ecosystem, self-host simplicity, and UX parity with the current app.

---

## 12. References in this repository

| Concern | Current file(s) |
|---------|-----------------|
| Document domain model | `src/lib/documents.ts`, `supabase/migrations/*.sql` |
| Library UI | `src/routes/_authenticated/library.tsx` |
| Upload + URL import | `src/routes/_authenticated/upload.tsx`, `src/lib/fetch-url.functions.ts` |
| Auth / domain gate | `src/lib/auth.functions.ts`, `src/routes/auth.tsx` |
| Folders | `src/components/folders-sidebar.tsx` |
| Roles / admin | `supabase/migrations/20260602150940_*.sql`, `isCurrentUserAdmin()` |
| i18n | `src/lib/i18n-messages.ts` |
| Security plan | `.lovable/plan.md` |

---

*This evaluation is based on the repository state as of 2026-06-11. PocketBase version features may vary; verify hook APIs against the target PocketBase release before implementation.*
