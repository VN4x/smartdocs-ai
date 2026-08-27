-- Enforce admin-only deletes end-to-end.
--
-- documents / folders: DELETE was already restricted to admins in
-- 20260602144049_854aa303-6e55-4626-9f04-89a413877b19.sql
--
-- storage.objects: DELETE was still open to any authenticated user, which
-- meant deleteDocument() could remove files from the bucket even when the
-- database row delete would fail for non-admins. Tighten storage to match.

DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;

DROP POLICY IF EXISTS "Authenticated users can delete document files" ON storage.objects;

CREATE POLICY "Admins can delete document files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
