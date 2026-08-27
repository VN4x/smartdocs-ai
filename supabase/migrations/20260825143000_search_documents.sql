-- Full-text search + filter RPCs for the library page.
-- Idempotent: safe to run on projects where these were applied manually via Lovable Cloud.

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- Immutable wrapper so unaccent can be used in generated columns.
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
SET search_path = public
AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'documents'
      AND column_name = 'search_tsv'
  ) THEN
    ALTER TABLE public.documents
      ADD COLUMN search_tsv tsvector
      GENERATED ALWAYS AS (
        to_tsvector(
          'simple',
          public.f_unaccent(
            coalesce(title, '') || ' ' ||
            coalesce(description, '') || ' ' ||
            coalesce(supplier, '') || ' ' ||
            coalesce(objekt, '') || ' ' ||
            coalesce(materjal, '') || ' ' ||
            coalesce(file_name, '') || ' ' ||
            coalesce(tuup, '') || ' ' ||
            coalesce(tellimuse_kinnitus, '') || ' ' ||
            array_to_string(tags, ' ')
          )
        )
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS documents_search_tsv_idx
  ON public.documents USING gin (search_tsv);

CREATE OR REPLACE FUNCTION public.search_documents(
  _q text DEFAULT NULL,
  _tuup text DEFAULT NULL,
  _objekt text DEFAULT NULL,
  _materjal text DEFAULT NULL,
  _supplier text DEFAULT NULL,
  _folder_ids uuid[] DEFAULT NULL,
  _unfiled boolean DEFAULT false,
  _limit integer DEFAULT 60,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  tuup text,
  tellimuse_kinnitus text,
  objekt text,
  materjal text,
  supplier text,
  doc_date date,
  tags text[],
  file_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  original_ext text,
  uploaded_by uuid,
  uploaded_by_name text,
  doc_number integer,
  folder_id uuid,
  thumbnail_path text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT
      d.id,
      d.title,
      d.description,
      d.tuup,
      d.tellimuse_kinnitus,
      d.objekt,
      d.materjal,
      d.supplier,
      d.doc_date,
      d.tags,
      d.file_path,
      d.file_name,
      d.file_size,
      d.mime_type,
      d.original_ext,
      d.uploaded_by,
      d.uploaded_by_name,
      d.doc_number,
      d.folder_id,
      d.thumbnail_path,
      d.created_at,
      d.updated_at,
      count(*) OVER () AS total_count
    FROM public.documents d
    WHERE
      (
        CASE
          WHEN _unfiled THEN d.folder_id IS NULL
          WHEN _folder_ids IS NOT NULL AND cardinality(_folder_ids) > 0
            THEN d.folder_id = ANY (_folder_ids)
          ELSE true
        END
      )
      AND (_tuup IS NULL OR d.tuup = _tuup)
      AND (_objekt IS NULL OR d.objekt = _objekt)
      AND (_materjal IS NULL OR d.materjal = _materjal)
      AND (_supplier IS NULL OR d.supplier = _supplier)
      AND (
        _q IS NULL
        OR btrim(_q) = ''
        OR d.search_tsv @@ websearch_to_tsquery('simple', public.f_unaccent(btrim(_q)))
      )
  )
  SELECT *
  FROM filtered
  ORDER BY created_at DESC
  LIMIT greatest(_limit, 1)
  OFFSET greatest(_offset, 0);
$$;

CREATE OR REPLACE FUNCTION public.document_filter_options()
RETURNS json
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT json_build_object(
    'types',
    coalesce(
      (
        SELECT json_agg(v ORDER BY v)
        FROM (
          SELECT DISTINCT tuup AS v
          FROM public.documents
          WHERE tuup IS NOT NULL AND btrim(tuup) <> ''
        ) s
      ),
      '[]'::json
    ),
    'objects',
    coalesce(
      (
        SELECT json_agg(v ORDER BY v)
        FROM (
          SELECT DISTINCT objekt AS v
          FROM public.documents
          WHERE objekt IS NOT NULL AND btrim(objekt) <> ''
        ) s
      ),
      '[]'::json
    ),
    'materials',
    coalesce(
      (
        SELECT json_agg(v ORDER BY v)
        FROM (
          SELECT DISTINCT materjal AS v
          FROM public.documents
          WHERE materjal IS NOT NULL AND btrim(materjal) <> ''
        ) s
      ),
      '[]'::json
    ),
    'suppliers',
    coalesce(
      (
        SELECT json_agg(v ORDER BY v)
        FROM (
          SELECT DISTINCT supplier AS v
          FROM public.documents
          WHERE supplier IS NOT NULL AND btrim(supplier) <> ''
        ) s
      ),
      '[]'::json
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.search_documents(
  text, text, text, text, text, uuid[], boolean, integer, integer
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.search_documents(
  text, text, text, text, text, uuid[], boolean, integer, integer
) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.document_filter_options() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.document_filter_options() TO authenticated, service_role;
