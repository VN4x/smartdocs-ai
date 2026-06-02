# User management, folders & security hardening

## 1. How accounts work (answering your question)
Today every person registers their **own** account — you do **not** share one login, and many people can be signed in at once on separate accounts. That stays. What changes is **who is allowed in** and **who can delete**.

- **Sign-in becomes magic-link only**, restricted to `@kvaliteetaken.ee` addresses.
- **Self-service password signup is removed** so strangers/bots can't create accounts.
- Passwords/tokens were already stored securely by Lovable Cloud (industry-standard hashing); nothing sensitive lives in the app code.

## 2. Restrict signup to your company domain
- Turn **off** open public signup in the auth settings, so the only way an account is created is through our gated flow.
- A small **public server function** handles "send me a login link": it validates the email ends in `@kvaliteetaken.ee`, creates the account on first use (only for that domain), and emails the login link. Any other domain is rejected — and because the check runs on the server, it can't be bypassed from the browser.
- The login page also checks the domain instantly for friendly feedback, and shows a clear "only @kvaliteetaken.ee" message.
- Enable leaked-password protection (defense-in-depth, in case password login is added later).

## 3. Admin role + "admin can delete"
- Add a proper roles system (separate `user_roles` table + `app_role` enum + a `has_role` security-definer function — the safe pattern that avoids privilege-escalation).
- **View:** any signed-in user can view and download all documents.
- **Upload / edit metadata / move into folders:** any signed-in user.
- **Delete documents:** **admins only** (enforced in the database, not just the UI — the delete button is hidden for non-admins and the policy blocks it server-side).
- Bootstrap: your account is promoted to admin so you can manage from day one (I'll confirm which `@kvaliteetaken.ee` address is the admin when we build).

## 4. Folders + sidebar
- New `folders` table (name, optional parent for nesting). Documents get an optional `folder_id`.
- **Left sidebar** (collapsible) lists folders, plus "All documents" and "Unfiled"; selecting one filters the library.
- Any signed-in user can create/rename folders and move documents; deleting a folder is admin-only (documents inside fall back to "Unfiled", never lost).
- Search keeps working across the current view.

## 5. Security findings — test & fix
The security scan flagged real issues. I'll fix each and re-run the scan to confirm:

- **Stored XSS (print)** — a document titled `</title><script>…` currently runs code in the print popup. Fix: HTML-escape the title (and any interpolated field) before writing the print window.
- **SSRF (URL import)** — the "import from URL" server function can be pointed at internal addresses (e.g. cloud metadata `169.254.169.254`, `localhost`, private `10./192.168.` ranges). Fix: reject non-public hosts/IPs before fetching.
- **Over-broad database policies** — tighten document **delete** to admins; keep view/insert/update scoped to signed-in users (documented as intentional for a shared team library).
- **SQL injection** — not a risk: all queries go through the parameterized data layer. No change needed; included for completeness.
- **Bot misuse / backdoors** — closed by disabling open signup + domain gating; service-role keys remain server-only; no hardcoded credentials.

## Technical notes
- **DB migrations:** `user_roles` + `app_role` enum + `has_role()`; `folders` table with GRANTs + RLS; add `folder_id` to `documents`; replace `USING(true)`/`WITH CHECK(true)` delete policy with `has_role(auth.uid(),'admin')`.
- **Auth:** disable public signup; public `createServerFn` for domain-gated magic-link request using the admin client; client-side domain validation in `auth.tsx`; magic-link-only UI (drop self-serve signup tab).
- **XSS:** `escapeHtml()` helper applied in `documents.$id.tsx` print().
- **SSRF:** host/IP allow-check in `fetch-url.functions.ts` (block loopback, RFC-1918, link-local/metadata, non-http(s)).
- **Sidebar:** shadcn `Sidebar` in the `_authenticated` layout; folder CRUD in `documents.ts`; library filters by `folder_id`.
- Re-run the security scan at the end and report results.
