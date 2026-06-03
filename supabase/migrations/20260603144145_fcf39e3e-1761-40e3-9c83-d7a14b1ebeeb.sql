-- Sequential, human-friendly document numbers + uploader display name.
CREATE SEQUENCE IF NOT EXISTS public.documents_doc_number_seq;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS doc_number integer;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploaded_by_name text;

-- Backfill existing rows in creation order so the oldest doc is 0001.
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC) AS rn
  FROM public.documents
)
UPDATE public.documents d
SET doc_number = o.rn
FROM ordered o
WHERE d.id = o.id AND d.doc_number IS NULL;

-- Continue the sequence after the highest existing number.
SELECT setval(
  'public.documents_doc_number_seq',
  COALESCE((SELECT max(doc_number) FROM public.documents), 0) + 1,
  false
);

ALTER TABLE public.documents
  ALTER COLUMN doc_number SET DEFAULT nextval('public.documents_doc_number_seq');

ALTER TABLE public.documents ALTER COLUMN doc_number SET NOT NULL;

-- Ensure numbers stay unique.
CREATE UNIQUE INDEX IF NOT EXISTS documents_doc_number_key ON public.documents (doc_number);