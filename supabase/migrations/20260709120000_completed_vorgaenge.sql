-- =============================================================================
-- Persistente Vorgangszustände (completed_vorgaenge)
-- Erledigte Vorgänge überleben Reload, Logout/Login und Server-Neustart.
-- Reaktivierung nur bei neuerer eingehender Kundenmail im gleichen Thread.
--
-- Supabase SQL Editor: gesamten Inhalt ausführen, danach App neu laden.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.completed_vorgaenge (
  id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                             UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  company_id                          TEXT NOT NULL DEFAULT '',
  provider                            TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  provider_thread_id                  TEXT NOT NULL,
  provider_message_id                 TEXT,
  case_id                             TEXT,
  vorgang_id                          TEXT,
  status                              TEXT NOT NULL DEFAULT 'erledigt',
  completed_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_by                        TEXT,
  last_known_incoming_message_at      TIMESTAMPTZ,
  last_known_outgoing_message_at      TIMESTAMPTZ,
  created_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.completed_vorgaenge IS
  'Persistente Vorgangszustände — Erledigt bleibt erledigt bis neue Kundenmail im Thread';

CREATE UNIQUE INDEX IF NOT EXISTS idx_completed_vorgaenge_provider_thread_company
  ON public.completed_vorgaenge (provider, provider_thread_id, company_id);

CREATE INDEX IF NOT EXISTS idx_completed_vorgaenge_user_status
  ON public.completed_vorgaenge (user_id, status);

CREATE INDEX IF NOT EXISTS idx_completed_vorgaenge_user_updated
  ON public.completed_vorgaenge (user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_completed_vorgaenge_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS completed_vorgaenge_set_updated_at ON public.completed_vorgaenge;
CREATE TRIGGER completed_vorgaenge_set_updated_at
  BEFORE UPDATE ON public.completed_vorgaenge
  FOR EACH ROW
  EXECUTE FUNCTION public.set_completed_vorgaenge_updated_at();

ALTER TABLE public.completed_vorgaenge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "completed_vorgaenge_select_own" ON public.completed_vorgaenge;
CREATE POLICY "completed_vorgaenge_select_own"
  ON public.completed_vorgaenge
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "completed_vorgaenge_insert_own" ON public.completed_vorgaenge;
CREATE POLICY "completed_vorgaenge_insert_own"
  ON public.completed_vorgaenge
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "completed_vorgaenge_update_own" ON public.completed_vorgaenge;
CREATE POLICY "completed_vorgaenge_update_own"
  ON public.completed_vorgaenge
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "completed_vorgaenge_delete_own" ON public.completed_vorgaenge;
CREATE POLICY "completed_vorgaenge_delete_own"
  ON public.completed_vorgaenge
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.completed_vorgaenge TO authenticated;

-- Schema-Cache für PostgREST aktualisieren
NOTIFY pgrst, 'reload schema';
