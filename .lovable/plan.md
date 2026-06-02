# Lightweight Document Management System (paperless)

A self-built, lean alternative to heavy open-source EDMS platforms — sized for ~400 documents now, ~100/year growth. Built on Lovable Cloud (database + file storage + auth). This plan covers **Phase 1: upload, organize, search**. The AI chatbot / semantic search is deferred to Phase 2.

## Goal

Replace folder-on-a-drive chaos with a searchable catalog of production documents (drawings, material certificates, strength calculations, order confirmations, etc.). Any file type can be stored and downloaded; metadata is the primary thing you search and filter by.

## Scope decisions (from your answers)

- **Access:** one shared team login (email/password). Everyone can upload, edit, and download.
- **First version:** metadata-driven search + filtering. No embeddings/AI yet.
- **Start fresh:** no bulk import; documents added going forward.
- **Metadata fields:** tüüp (type), tellimuse kinnitus (order confirmation), objekt (object/project), materjal (material), date, supplier.
- **File types:** any (pdf, txt, dwg, doc, xls, xml, osd…). PDF/image preview in-browser; everything else is download.
-  attach google drive option if possible, for easy uploads (vps pulls on trigger button)

## What gets built

### 1. Backend (Lovable Cloud)

- Enable Lovable Cloud (database, storage, auth).
- `**documents` table** with columns:
  - `title`, `description`
  - `tuup` (type — e.g. drawing, certificate, calculation, order confirmation…)
  - `tellimuse_kinnitus` (order confirmation reference)
  - `objekt` (object / project)
  - `materjal` (material)
  - `doc_date` (document date)
  - `supplier`
  - `tags` (free tags, array)
  - `file_path`, `file_name`, `file_size`, `mime_type`, `original_ext`
  - `created_at`, `updated_at`
- **Storage bucket** `documents` (private) for the actual files, accessed through signed/authenticated URLs.
- RLS so only signed-in team members can read/write.

### 2. Auth

- Simple email/password sign-in page (one shared account). Protected app behind it.

### 3. App screens

- **Library (home):** searchable, filterable table/grid of all documents.
  - Full-text search across title/description/supplier/object/material/tags.
  - Filter chips/dropdowns: type, object, material, supplier, date range.
  - Sort by date, title, type.
- **Upload:** drag-and-drop file + metadata form. Auto-captures file name, size, type, extension.
- **Document detail:** metadata view, inline preview for PDF/images, download button for everything, edit + delete.

### 4. Quality

- Responsive, clean UI with a proper design system (semantic tokens).
- Empty states, loading states, basic validation on the upload form.

## Phase 2 (later, not in this build)

- Text extraction from PDF/TXT/DOC/XLS → store chunks.
- Embeddings + pgvector for semantic "find similar / find by meaning" search.
- RAG AI chatbot answering questions over extractable documents.
- Note: DWG/OSD and other binary CAD files can't be text-extracted — they'll always be searchable by metadata only.

## Technical notes

- Stack: TanStack Start + Lovable Cloud (Supabase under the hood).
- Files stored in a private storage bucket; metadata in Postgres.
- Server functions (`createServerFn`) for uploads/queries; RLS enforced.
- Search in Phase 1 is SQL `ilike` / filter based — fast and sufficient at this scale.

- For metadata fields like **type**, we want fixed dropdown options with free text as your "Write your own" or "create new". default to dropdowns with a small editable list (drawing, material certificate, strength calculation, order confirmation, other) unless you prefer free text.