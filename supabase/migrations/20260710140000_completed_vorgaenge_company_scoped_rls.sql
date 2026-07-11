-- =============================================================================
-- HELPY: completed_vorgaenge von user-scoped → company-scoped (RLS)
-- Voraussetzung: current_user_company_id() (companies-Migration)
-- user_id bleibt erhalten (wer erledigt hat), Sicherheitsgrenze ist company_id
--
-- Supabase SQL Editor: gesamten Inhalt ausführen, danach App neu laden.
-- =============================================================================

-- company_id aus profiles nachziehen (Mock-Strings wie helpy-demo-company ersetzen)
UPDATE public.completed_vorgaenge cv
SET company_id = p.company_id::text
FROM public.profiles p
WHERE p.id = cv.user_id;

-- Zeilen ohne gültige Firmenzuordnung entfernen (sollte bei leerer Tabelle 0 sein)
DELETE FROM public.completed_vorgaenge
WHERE company_id IS NULL
   OR company_id = ''
   OR company_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

ALTER TABLE public.completed_vorgaenge
  ALTER COLUMN company_id DROP DEFAULT;

ALTER TABLE public.completed_vorgaenge
  ALTER COLUMN company_id TYPE UUID USING company_id::uuid;

ALTER TABLE public.completed_vorgaenge
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.completed_vorgaenge
  DROP CONSTRAINT IF EXISTS completed_vorgaenge_company_id_fkey;

ALTER TABLE public.completed_vorgaenge
  ADD CONSTRAINT completed_vorgaenge_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies (id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_completed_vorgaenge_user_status;
DROP INDEX IF EXISTS idx_completed_vorgaenge_user_updated;

CREATE INDEX IF NOT EXISTS idx_completed_vorgaenge_company_status
  ON public.completed_vorgaenge (company_id, status);

CREATE INDEX IF NOT EXISTS idx_completed_vorgaenge_company_updated
  ON public.completed_vorgaenge (company_id, updated_at DESC);

DROP POLICY IF EXISTS "completed_vorgaenge_select_own" ON public.completed_vorgaenge;
DROP POLICY IF EXISTS "completed_vorgaenge_insert_own" ON public.completed_vorgaenge;
DROP POLICY IF EXISTS "completed_vorgaenge_update_own" ON public.completed_vorgaenge;
DROP POLICY IF EXISTS "completed_vorgaenge_delete_own" ON public.completed_vorgaenge;

CREATE POLICY "completed_vorgaenge_select_company"
  ON public.completed_vorgaenge
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY "completed_vorgaenge_insert_company"
  ON public.completed_vorgaenge
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "completed_vorgaenge_update_company"
  ON public.completed_vorgaenge
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "completed_vorgaenge_delete_company"
  ON public.completed_vorgaenge
  FOR DELETE
  TO authenticated
  USING (company_id = public.current_user_company_id());

NOTIFY pgrst, 'reload schema';
