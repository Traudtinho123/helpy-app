-- =============================================================================
-- HELPY Analytics: Vorgangs-Ereignisse für Dashboard-Kennzahlen
-- Voraussetzung: companies + current_user_company_id()
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.vorgang_events (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  provider               TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  provider_thread_id     TEXT NOT NULL,
  vorgang_id             TEXT NOT NULL,
  typ                    TEXT NOT NULL,
  intent                 TEXT,
  intent_label           TEXT,
  kunde_name             TEXT,
  prioritaet             TEXT,
  is_appointment_request BOOLEAN NOT NULL DEFAULT false,
  is_new_inquiry         BOOLEAN NOT NULL DEFAULT false,
  received_at            TIMESTAMPTZ NOT NULL,
  erkannt_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT vorgang_events_unique_thread_received
    UNIQUE (company_id, provider, provider_thread_id, received_at)
);

COMMENT ON TABLE public.vorgang_events IS
  'Analytics: ein Ereignis pro erkanntem Vorgang/Eingang — Basis für Dashboard-Charts';

CREATE INDEX IF NOT EXISTS idx_vorgang_events_company_received
  ON public.vorgang_events (company_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_vorgang_events_company_erkannt
  ON public.vorgang_events (company_id, erkannt_at DESC);

CREATE INDEX IF NOT EXISTS idx_vorgang_events_company_typ
  ON public.vorgang_events (company_id, typ, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_vorgang_events_company_appointment
  ON public.vorgang_events (company_id, is_appointment_request, received_at DESC)
  WHERE is_appointment_request = true;

ALTER TABLE public.vorgang_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vorgang_events_select_company" ON public.vorgang_events;
CREATE POLICY "vorgang_events_select_company"
  ON public.vorgang_events FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "vorgang_events_insert_company" ON public.vorgang_events;
CREATE POLICY "vorgang_events_insert_company"
  ON public.vorgang_events FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND user_id = auth.uid()
  );

GRANT SELECT, INSERT ON public.vorgang_events TO authenticated;

NOTIFY pgrst, 'reload schema';
