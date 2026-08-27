# Admin roles and access control

## Two separate gates

| Layer | What it controls | How |
|-------|------------------|-----|
| **Domain login** | Who may sign in at all | Any `@kvaliteetaken.ee` email can request a magic link (`src/lib/auth.functions.ts`) |
| **Admin role** | Who may delete documents and folders | Row in `user_roles` with `role = 'admin'` |

Signing in with a team email does **not** make you an admin. Lovable editor login is unrelated to app permissions.

## Current admins

These addresses are auto-granted `admin` on each login-link request (`ensure_admin_for_email`):

| Email |
|-------|
| `dok@kvaliteetaken.ee` |
| `doc@kvaliteetaken.ee` |
| `elmo@kvaliteetaken.ee` |

Defined in: `supabase/migrations/20260602150940_81d569ec-fae5-4db6-94a3-1d766e5b728c.sql`

## What admins can do that regular users cannot

- Delete documents (database row + storage file)
- Delete folders
- Grant or revoke roles in `user_roles` (RLS)

Regular authenticated users can still view, upload, edit metadata, and move documents.

## How to add or remove an admin

### Option A — Update the allowlist (recommended for permanent admins)

1. Edit the email list inside `ensure_admin_for_email` in a new migration, **or** run in Supabase SQL editor:

```sql
-- Example: add newadmin@kvaliteetaken.ee to the allowlist
CREATE OR REPLACE FUNCTION public.ensure_admin_for_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
BEGIN
  IF lower(_email) NOT IN (
    'dok@kvaliteetaken.ee',
    'doc@kvaliteetaken.ee',
    'elmo@kvaliteetaken.ee',
    'newadmin@kvaliteetaken.ee'  -- add here
  ) THEN
    RETURN;
  END IF;

  SELECT id INTO _uid FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  IF _uid IS NULL THEN RETURN; END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
```

2. Ask the new admin to sign in once (magic link) so `requestLoginLink` runs `ensure_admin_for_email`.

### Option B — One-off grant (existing user)

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('newadmin@kvaliteetaken.ee')
ON CONFLICT (user_id, role) DO NOTHING;
```

Only an existing admin (or service role in SQL editor) can insert into `user_roles` via the app.

### Remove admin

```sql
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE lower(email) = lower('someone@kvaliteetaken.ee'))
  AND role = 'admin';
```

## Verify who you are in the app

In the browser: DevTools → Application → Local Storage → Supabase auth session → check the `email` claim.

Or in SQL:

```sql
SELECT u.email, ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.email;
```

## Applying RLS migrations

After pulling migration changes, apply them to your Supabase project:

- **Lovable Cloud:** run the SQL from `supabase/migrations/` in the Supabase SQL editor, or use Supabase CLI `db push` if linked.
- Migration `20260825143001_rls_admin_only_delete.sql` restricts **storage** deletes to admins (database deletes were already admin-only).
