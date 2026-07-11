-- =============================================================================
-- HELPY Voice Assistant v1 — Einstellungen + Anrufprotokoll (pro Unternehmen)
-- =============================================================================

CREATE TYPE public.voice_call_status AS ENUM (
  'ringing',
  'in_progress',
  'completed',
  'failed',
  'missed'
);

CREATE TABLE IF NOT EXISTS public.voice_settings (
  company_id        UUID PRIMARY KEY REFERENCES public.companies (id) ON DELETE CASCADE,
  enabled           BOOLEAN NOT NULL DEFAULT false,
  provider          TEXT NOT NULL DEFAULT 'simulation',
  phone_number      TEXT,
  greeting_text     TEXT NOT NULL DEFAULT 'Guten Tag, Sie erreichen uns. Wie kann ich Ihnen helfen?',
  disclosure_text   TEXT NOT NULL DEFAULT 'Hinweis: Sie sprechen mit einem KI-gestützten Telefonassistenten.',
  business_hours    JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.voice_settings IS
  'Telefonassistent-Einstellungen pro Mandant. Zugriff serverseitig (service role).';

CREATE TABLE IF NOT EXISTS public.voice_calls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  external_call_id  TEXT,
  caller_phone      TEXT,
  caller_name       TEXT,
  status            public.voice_call_status NOT NULL DEFAULT 'completed',
  duration_seconds  INTEGER,
  transcript        TEXT,
  summary           TEXT,
  intent            TEXT,
  vorgang_id        TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT voice_calls_duration_non_negative
    CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

COMMENT ON TABLE public.voice_calls IS
  'Protokoll eingehender Anrufe. Keine Audio-Aufzeichnung im MVP.';

CREATE INDEX IF NOT EXISTS idx_voice_calls_company_id
  ON public.voice_calls (company_id);

CREATE INDEX IF NOT EXISTS idx_voice_calls_company_started
  ON public.voice_calls (company_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_calls_vorgang_id
  ON public.voice_calls (vorgang_id)
  WHERE vorgang_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_voice_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS voice_settings_set_updated_at ON public.voice_settings;
CREATE TRIGGER voice_settings_set_updated_at
  BEFORE UPDATE ON public.voice_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_voice_settings_updated_at();

ALTER TABLE public.voice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.voice_settings IS
  'RLS aktiv ohne Policies: Zugriff ausschliesslich via service role in API-Routes.';
