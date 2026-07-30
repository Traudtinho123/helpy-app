-- Suchprofil & Objekt-Matching Migration

CREATE TABLE IF NOT EXISTS public.suchprofile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kunde_id UUID NOT NULL REFERENCES public.kunden(id) ON DELETE CASCADE,
  art TEXT NOT NULL DEFAULT 'mieten' CHECK (art IN ('kaufen', 'mieten')),
  objekttyp TEXT[] DEFAULT '{}',
  zimmer_min DECIMAL(3, 1),
  zimmer_max DECIMAL(3, 1),
  flaeche_min INTEGER,
  flaeche_max INTEGER,
  preis_max DECIMAL(12, 2),
  lagen TEXT[] DEFAULT '{}',
  muss_kriterien TEXT[] DEFAULT '{}',
  notizen TEXT,
  aktiv BOOLEAN NOT NULL DEFAULT true,
  auto_erkannt BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.objekt_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  objekt_id TEXT NOT NULL,
  kunde_id UUID NOT NULL REFERENCES public.kunden(id) ON DELETE CASCADE,
  suchprofil_id UUID NOT NULL REFERENCES public.suchprofile(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  score_details JSONB NOT NULL DEFAULT '{}',
  notified BOOLEAN NOT NULL DEFAULT false,
  kontaktiert BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suchprofile_company_kunde
  ON public.suchprofile (company_id, kunde_id);

CREATE INDEX IF NOT EXISTS idx_suchprofile_aktiv
  ON public.suchprofile (company_id, aktiv)
  WHERE aktiv = true;

CREATE INDEX IF NOT EXISTS idx_objekt_matches_objekt
  ON public.objekt_matches (company_id, objekt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_objekt_matches_kunde
  ON public.objekt_matches (company_id, kunde_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_objekt_matches_created
  ON public.objekt_matches (company_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_objekt_matches_unique
  ON public.objekt_matches (company_id, objekt_id, kunde_id, suchprofil_id);

ALTER TABLE public.suchprofile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objekt_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suchprofile_company" ON public.suchprofile;
CREATE POLICY "suchprofile_company"
  ON public.suchprofile FOR ALL TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "objekt_matches_company" ON public.objekt_matches;
CREATE POLICY "objekt_matches_company"
  ON public.objekt_matches FOR ALL TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suchprofile TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objekt_matches TO authenticated;

NOTIFY pgrst, 'reload schema';
