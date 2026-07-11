-- =============================================================================
-- HELPY Enterprise OAuth v1 — Mandantenfähige Verbindungen (Google / Microsoft)
-- Tokens nur serverseitig (service role); Frontend sieht Metadaten via API.
-- =============================================================================

CREATE TYPE public.oauth_provider AS ENUM ('google', 'microsoft');

CREATE TYPE public.oauth_connection_status AS ENUM ('active', 'error', 'revoked');

CREATE TABLE IF NOT EXISTS public.oauth_connections (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  connected_by_user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  provider                public.oauth_provider NOT NULL,
  account_email           TEXT NOT NULL,
  access_token_encrypted  TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at        TIMESTAMPTZ,
  scopes                  TEXT[] NOT NULL DEFAULT '{}',
  status                  public.oauth_connection_status NOT NULL DEFAULT 'active',
  last_sync_at            TIMESTAMPTZ,
  last_error              TEXT,
  connected_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT oauth_connections_account_email_not_empty
    CHECK (char_length(trim(account_email)) > 0),
  CONSTRAINT oauth_connections_company_provider_email_unique
    UNIQUE (company_id, provider, account_email)
);

COMMENT ON TABLE public.oauth_connections IS
  'Enterprise OAuth: pro Unternehmen mehrere Google-/Microsoft-Mailkonten. Tokens verschlüsselt, Zugriff nur serverseitig.';

CREATE INDEX IF NOT EXISTS idx_oauth_connections_company_id
  ON public.oauth_connections (company_id);

CREATE INDEX IF NOT EXISTS idx_oauth_connections_company_provider
  ON public.oauth_connections (company_id, provider);

CREATE INDEX IF NOT EXISTS idx_oauth_connections_status
  ON public.oauth_connections (status);

CREATE OR REPLACE FUNCTION public.set_oauth_connections_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS oauth_connections_set_updated_at ON public.oauth_connections;
CREATE TRIGGER oauth_connections_set_updated_at
  BEFORE UPDATE ON public.oauth_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_oauth_connections_updated_at();

ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;

-- Kein direkter Client-Zugriff — nur HELPY Server-API (service role).
COMMENT ON TABLE public.oauth_connections IS
  'RLS aktiv ohne Policies: Zugriff ausschliesslich via service role in API-Routes.';
