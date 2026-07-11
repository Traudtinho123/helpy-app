-- =============================================================================
-- HELPY Company Knowledge v1 — Firmenwissen pro Mandant (Supabase-Persistenz)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.company_knowledge (
  company_id  UUID PRIMARY KEY REFERENCES public.companies (id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT company_knowledge_data_is_object
    CHECK (jsonb_typeof(data) = 'object')
);

COMMENT ON TABLE public.company_knowledge IS
  'HELPY-Firmenwissen pro Mandant. Eine Zeile pro company_id — geteilt von allen Nutzern derselben Firma.';

COMMENT ON COLUMN public.company_knowledge.data IS
  'Serialisiertes CompanyKnowledge (Termine, Arbeitszeiten, Antwortstil, FAQ, …).';

COMMENT ON COLUMN public.company_knowledge.updated_by IS
  'auth.users.id des letzten Speicherns.';

CREATE INDEX IF NOT EXISTS idx_company_knowledge_updated_at
  ON public.company_knowledge (updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_company_knowledge_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS company_knowledge_set_updated_at ON public.company_knowledge;
CREATE TRIGGER company_knowledge_set_updated_at
  BEFORE UPDATE ON public.company_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_knowledge_updated_at();

ALTER TABLE public.company_knowledge ENABLE ROW LEVEL SECURITY;

-- Nur das eigene Unternehmen lesen (company_id = Profil des eingeloggten Users)
DROP POLICY IF EXISTS "company_knowledge_select_own_company" ON public.company_knowledge;
CREATE POLICY "company_knowledge_select_own_company"
  ON public.company_knowledge
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_user_company_id());

-- Nur ins eigene Unternehmen schreiben
DROP POLICY IF EXISTS "company_knowledge_insert_own_company" ON public.company_knowledge;
CREATE POLICY "company_knowledge_insert_own_company"
  ON public.company_knowledge
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "company_knowledge_update_own_company" ON public.company_knowledge;
CREATE POLICY "company_knowledge_update_own_company"
  ON public.company_knowledge
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

GRANT SELECT, INSERT, UPDATE ON public.company_knowledge TO authenticated;

NOTIFY pgrst, 'reload schema';
