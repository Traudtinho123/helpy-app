-- Deal-Pipeline — Copy-Paste für Supabase SQL Editor
-- Hinweis: objekt_id ist TEXT (Objekte liegen client-seitig in localStorage)

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  objekt_id TEXT NOT NULL,
  kunde_id UUID REFERENCES public.kunden(id) ON DELETE SET NULL,
  vorgang_id TEXT,
  deal_type TEXT NOT NULL DEFAULT 'verkauf' CHECK (deal_type IN ('verkauf', 'vermietung')),
  phase INTEGER NOT NULL DEFAULT 1 CHECK (phase >= 1 AND phase <= 9),
  phase_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provision_prozent DECIMAL(5, 2),
  provision_chf DECIMAL(10, 2),
  provision_status TEXT NOT NULL DEFAULT 'ausstehend'
    CHECK (provision_status IN ('ausstehend', 'verdient', 'bezahlt')),
  notizen TEXT,
  naechste_aktion TEXT,
  naechste_aktion_datum TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deal_aktivitaeten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  typ TEXT NOT NULL CHECK (typ IN ('phase_wechsel', 'notiz', 'kontakt', 'auto_erkannt')),
  von_phase INTEGER,
  zu_phase INTEGER,
  beschreibung TEXT,
  erstellt_von UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_company_phase
  ON public.deals (company_id, phase)
  WHERE phase < 9;

CREATE INDEX IF NOT EXISTS idx_deals_objekt
  ON public.deals (company_id, objekt_id);

CREATE INDEX IF NOT EXISTS idx_deals_vorgang
  ON public.deals (company_id, vorgang_id)
  WHERE vorgang_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deal_aktivitaeten_deal
  ON public.deal_aktivitaeten (deal_id, created_at DESC);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_aktivitaeten ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deals_company" ON public.deals;
CREATE POLICY "deals_company"
  ON public.deals FOR ALL TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "aktivitaeten_company" ON public.deal_aktivitaeten;
CREATE POLICY "aktivitaeten_company"
  ON public.deal_aktivitaeten FOR ALL TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT SELECT, INSERT ON public.deal_aktivitaeten TO authenticated;

NOTIFY pgrst, 'reload schema';
