-- Document type catalog (editable list of types, with "create new" support)
CREATE TABLE public.document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_types TO authenticated;
GRANT ALL ON public.document_types TO service_role;

ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view document types"
  ON public.document_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can add document types"
  ON public.document_types FOR INSERT TO authenticated WITH CHECK (true);

-- Seed default types
INSERT INTO public.document_types (name) VALUES
  ('Drawing'),
  ('Material certificate'),
  ('Strength calculation'),
  ('Order confirmation'),
  ('Other');

-- Documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tuup TEXT,                    -- type (tüüp)
  tellimuse_kinnitus TEXT,      -- order confirmation reference
  objekt TEXT,                  -- object / project
  materjal TEXT,                -- material
  supplier TEXT,                -- supplier
  doc_date DATE,                -- document date
  tags TEXT[] NOT NULL DEFAULT '{}',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  original_ext TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Single shared team: any authenticated user has full access
CREATE POLICY "Authenticated users can view documents"
  ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert documents"
  ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update documents"
  ON public.documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete documents"
  ON public.documents FOR DELETE TO authenticated USING (true);

CREATE INDEX documents_created_at_idx ON public.documents (created_at DESC);
CREATE INDEX documents_tuup_idx ON public.documents (tuup);
CREATE INDEX documents_objekt_idx ON public.documents (objekt);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER documents_set_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();