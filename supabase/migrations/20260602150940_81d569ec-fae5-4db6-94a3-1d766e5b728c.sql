-- Admin allowlist: auto-grant admin role to known admin addresses.
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
    'elmo@kvaliteetaken.ee'
  ) THEN
    RETURN;
  END IF;

  SELECT id INTO _uid FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  IF _uid IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_admin_for_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_admin_for_email(text) TO service_role;

-- Bootstrap the admin that has already signed in.
SELECT public.ensure_admin_for_email('dok@kvaliteetaken.ee');