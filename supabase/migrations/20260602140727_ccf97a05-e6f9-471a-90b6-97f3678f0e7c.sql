-- Fix mutable search_path on the trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Storage policies for the private "documents" bucket
CREATE POLICY "Authenticated users can read document files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload document files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update document files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete document files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents');