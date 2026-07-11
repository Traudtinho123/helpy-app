-- =============================================================================
-- HELPY Phone — Standard-Antworten pro Mandant
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.voice_standard_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  trigger_text  TEXT NOT NULL,
  response_text TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'allgemein',
  enabled       BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT voice_standard_responses_category_check
    CHECK (category IN ('allgemein', 'objekte', 'termine', 'preise'))
);

CREATE INDEX IF NOT EXISTS idx_voice_standard_responses_company
  ON public.voice_standard_responses (company_id, sort_order);

ALTER TABLE public.voice_standard_responses ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.voice_standard_responses IS
  'Vordefinierte Telefon-Antworten für HELPY GPT-4o Prompt. Zugriff via service role.';
