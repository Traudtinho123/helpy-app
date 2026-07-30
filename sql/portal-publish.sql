-- Portal-Publishing (ImmoScout24.ch / Homegate.ch)
-- Objekte leben clientseitig (localStorage) — deshalb objekt_id TEXT,
-- analog zu deals.objekt_id / objekt_matches.objekt_id.

CREATE TABLE IF NOT EXISTS public.objekt_portal_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  objekt_id TEXT NOT NULL,
  immoscout_id TEXT,
  homegate_id TEXT,
  immoscout_url TEXT,
  homegate_url TEXT,
  portal_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  portal_published_at TIMESTAMPTZ,
  duration_days INTEGER NOT NULL DEFAULT 30
    CHECK (duration_days IN (7, 30, 90)),
  bilder_urls TEXT[] NOT NULL DEFAULT '{}',
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, objekt_id)
);

CREATE INDEX IF NOT EXISTS idx_objekt_portal_listings_company
  ON public.objekt_portal_listings (company_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_objekt_portal_listings_objekt
  ON public.objekt_portal_listings (company_id, objekt_id);

ALTER TABLE public.objekt_portal_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "objekt_portal_listings_company" ON public.objekt_portal_listings;
CREATE POLICY "objekt_portal_listings_company"
  ON public.objekt_portal_listings FOR ALL TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.objekt_portal_listings TO authenticated;

-- Supabase Storage Bucket für Objektbilder
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'objekt-bilder',
  'objekt-bilder',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "objekt_bilder_select" ON storage.objects;
CREATE POLICY "objekt_bilder_select"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'objekt-bilder');

DROP POLICY IF EXISTS "objekt_bilder_insert" ON storage.objects;
CREATE POLICY "objekt_bilder_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'objekt-bilder'
    AND (storage.foldername(name))[1] = public.current_user_company_id()::text
  );

DROP POLICY IF EXISTS "objekt_bilder_update" ON storage.objects;
CREATE POLICY "objekt_bilder_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'objekt-bilder'
    AND (storage.foldername(name))[1] = public.current_user_company_id()::text
  );

DROP POLICY IF EXISTS "objekt_bilder_delete" ON storage.objects;
CREATE POLICY "objekt_bilder_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'objekt-bilder'
    AND (storage.foldername(name))[1] = public.current_user_company_id()::text
  );

NOTIFY pgrst, 'reload schema';
