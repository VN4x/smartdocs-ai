# Upload via URL

Replace the Google Drive idea with a simple **"Upload via URL"** field on the upload page. The user pastes a share/direct link (Google Drive file, Dropbox, or any URL); a server function downloads the file, stores it in the document library, and pre-fills the metadata form. Folder import is out of scope for now (single file only), and can be added later via Google Drive OAuth.

## How it works

```text
User pastes URL ──> [Fetch] button
        │
        ▼
 createServerFn (server-only)
   1. validate + normalize URL (Drive/Dropbox → direct download)
   2. fetch file (follow redirects, 100 MB cap)
   3. read filename (Content-Disposition) + content-type
   4. upload bytes to private "documents" bucket (admin client)
   5. return { path, file_name, file_size, mime_type, original_ext }
        │
        ▼
 Upload page shows the fetched file like a chosen file,
 pre-fills Title, then user fills metadata and saves as usual.
```

## Changes

### 1. New server function — `src/lib/fetch-url.functions.ts`
- `fetchDocumentFromUrl` (`createServerFn`, POST), protected with `requireSupabaseAuth`.
- Input validated with Zod: a single `url` string (valid http/https, max length).
- URL normalization for common providers:
  - **Google Drive file** (`/file/d/{id}/...` or `?id={id}`) → `https://drive.google.com/uc?export=download&id={id}`.
  - **Dropbox** (`?dl=0` / `www.dropbox.com`) → forced direct download (`dl=1`).
  - Any other URL is fetched as-is.
- Fetch with redirect following; reject non-OK responses with a clear message.
- Enforce **100 MB** cap (check `Content-Length` when present, and abort while streaming if exceeded).
- Derive filename from `Content-Disposition`, else from the URL path, else a fallback; sanitize it.
- Upload to the private `documents` bucket at `${uuid}/${safeName}` using the admin client (imported inside the handler).
- Return `{ path, file_name, file_size, mime_type, original_ext }`.
- Detect Google Drive **folder** URLs (`/drive/folders/...`) and return a friendly "folder import isn't supported yet — paste a single file link" error.

### 2. Upload page — `src/routes/_authenticated/upload.tsx`
- Introduce a small "pending upload" concept so the form works with **either**:
  - a locally chosen `File` (uploaded on submit, current behavior), or
  - a **remote-fetched** file (already in storage; carries `path` + metadata).
- Add an **"Upload via URL"** section above/next to the drag-and-drop box:
  - URL `Input` + **Fetch** button with a loading state.
  - On success, show the fetched file card (name + size) the same way a chosen file appears, and pre-fill `Title` if empty.
  - On error, show a toast with the server message.
- Update `handleSubmit`:
  - If a local file is selected → upload then create the document (unchanged).
  - If a remote file was fetched → skip re-upload and create the document using the returned `path`, `file_name`, `file_size`, `mime_type`, `original_ext`.
- Helper text noting: single file only; works with Google Drive file links, Dropbox links, or any direct download URL; the file/folder must be publicly shared (anyone-with-link).

### 3. No schema or storage changes
- Reuses the existing `documents` table, `document_types`, and the private `documents` bucket. No migration needed.

## Technical notes / caveats
- The download runs **server-side**, which avoids browser CORS limits and keeps the file off the client.
- Google Drive direct download works for normally shared files. Very large Drive files can show a virus-scan interstitial; if the response looks like HTML instead of the file, the server returns a clear "couldn't fetch — make sure the link is publicly shared" message.
- Only `http(s)` URLs are allowed (basic SSRF safety); the fetch is limited to the providers/links the user pastes and capped at 100 MB.
- Folder import (e.g. pulling a whole Google Drive folder) requires the provider API with OAuth and is intentionally deferred to a later phase.
