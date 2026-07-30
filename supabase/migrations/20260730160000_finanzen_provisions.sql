-- Provisions-Tracking (Finanzen)

ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS verkaufspreis_chf DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS provision_mwst_prozent DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS provision_rechnung_nr TEXT,
ADD COLUMN IF NOT EXISTS provision_rechnung_url TEXT,
ADD COLUMN IF NOT EXISTS provision_bezahlt_am TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS provision_monatsziel DECIMAL(10, 2);

ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_provision_status_check;
ALTER TABLE public.deals
ADD CONSTRAINT deals_provision_status_check
CHECK (provision_status IN ('ausstehend', 'verdient', 'rechnungsgestellt', 'bezahlt'));

CREATE TABLE IF NOT EXISTS public.rechnungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  nummer TEXT NOT NULL,
  empfaenger_name TEXT,
  empfaenger_email TEXT,
  betrag_netto DECIMAL(10, 2),
  mwst_prozent DECIMAL(5, 2) DEFAULT 0,
  betrag_brutto DECIMAL(10, 2),
  status TEXT DEFAULT 'entwurf'
    CHECK (status IN ('entwurf', 'gesendet', 'bezahlt', 'storniert')),
  faellig_am TIMESTAMPTZ,
  bezahlt_am TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rechnungen_company
  ON public.rechnungen (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rechnungen_deal
  ON public.rechnungen (deal_id)
  WHERE deal_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rechnungen_nummer_company
  ON public.rechnungen (company_id, nummer);

ALTER TABLE public.rechnungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rechnungen_company" ON public.rechnungen;
CREATE POLICY "rechnungen_company"
  ON public.rechnungen FOR ALL TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rechnungen TO authenticated;

NOTIFY pgrst, 'reload schema';
