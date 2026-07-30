-- E-Signatur / DocuSign

CREATE TABLE IF NOT EXISTS public.dokumente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  helpy_document_id TEXT NOT NULL,
  title TEXT,
  vorgang_id TEXT,
  kunde_id UUID REFERENCES public.kunden(id) ON DELETE SET NULL,
  objekt_id TEXT,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  signature_status TEXT NOT NULL DEFAULT 'entwurf'
    CHECK (signature_status IN (
      'entwurf', 'gesendet', 'teilweise', 'vollstaendig', 'abgelaufen', 'abgebrochen'
    )),
  signature_request_id TEXT,
  signature_envelope_id TEXT,
  signature_sent_at TIMESTAMPTZ,
  signature_completed_at TIMESTAMPTZ,
  signed_document_url TEXT,
  signers JSONB NOT NULL DEFAULT '[]'::jsonb,
  signature_message TEXT,
  signature_provider TEXT NOT NULL DEFAULT 'docusign',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, helpy_document_id)
);

CREATE INDEX IF NOT EXISTS idx_dokumente_company ON public.dokumente (company_id);
CREATE INDEX IF NOT EXISTS idx_dokumente_envelope ON public.dokumente (signature_envelope_id)
  WHERE signature_envelope_id IS NOT NULL;

ALTER TABLE public.dokumente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dokumente_company"
  ON public.dokumente FOR ALL TO authenticated
  USING (company_id = public.current_user_company_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dokumente TO authenticated;
