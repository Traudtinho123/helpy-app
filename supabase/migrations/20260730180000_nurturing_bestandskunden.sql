-- Bestandskunden-Nurturing
-- HELPY bereitet Mails vor — Senden nur nach manueller Genehmigung.

ALTER TABLE public.kunden
  ADD COLUMN IF NOT EXISTS letzter_kontakt TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS letzter_deal_abschluss TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS letzter_deal_id UUID,
  ADD COLUMN IF NOT EXISTS letzter_deal_objekt_id TEXT,
  ADD COLUMN IF NOT EXISTS nurturing_aktiv BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.kunden.letzter_kontakt IS
  'Zeitpunkt des letzten Kontakts (Mail/Anruf/Deal-Aktivität)';
COMMENT ON COLUMN public.kunden.letzter_deal_abschluss IS
  'Abschlussdatum des letzten Deals (Phase 9)';
COMMENT ON COLUMN public.kunden.nurturing_aktiv IS
  'false = Kunde von Nurturing-Kampagnen ausgeschlossen';

CREATE TABLE IF NOT EXISTS public.nurturing_mails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kunde_id UUID NOT NULL REFERENCES public.kunden(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  campaign_type TEXT NOT NULL
    CHECK (campaign_type IN ('marktupdate', 'jahrestag', 'weiterempfehlung')),
  status TEXT NOT NULL DEFAULT 'vorbereitet'
    CHECK (status IN ('vorbereitet', 'gesendet', 'abgebrochen')),
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,
  to_email TEXT NOT NULL,
  kunde_name TEXT,
  objekt_label TEXT,
  scheduled_for DATE NOT NULL DEFAULT (CURRENT_DATE),
  prepared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  tracking_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  opened_at TIMESTAMPTZ,
  open_count INTEGER NOT NULL DEFAULT 0,
  replied_at TIMESTAMPTZ,
  deal_created_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, kunde_id, campaign_type, scheduled_for)
);

CREATE INDEX IF NOT EXISTS idx_nurturing_mails_company_status
  ON public.nurturing_mails (company_id, status, prepared_at DESC);

CREATE INDEX IF NOT EXISTS idx_nurturing_mails_kunde
  ON public.nurturing_mails (company_id, kunde_id, campaign_type);

CREATE INDEX IF NOT EXISTS idx_nurturing_mails_tracking
  ON public.nurturing_mails (tracking_token);

CREATE INDEX IF NOT EXISTS idx_kunden_bestandskunde_nurturing
  ON public.kunden (company_id, status, letzter_deal_abschluss)
  WHERE status = 'bestandskunde' AND nurturing_aktiv = true;

ALTER TABLE public.nurturing_mails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nurturing_mails_company" ON public.nurturing_mails;
CREATE POLICY "nurturing_mails_company"
  ON public.nurturing_mails FOR ALL TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nurturing_mails TO authenticated;

NOTIFY pgrst, 'reload schema';
