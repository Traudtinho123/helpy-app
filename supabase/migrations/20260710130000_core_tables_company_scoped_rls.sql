-- =============================================================================
-- HELPY: Kern-Tabellen von user-scoped → company-scoped (RLS)
-- Voraussetzung: current_user_company_id() (companies-Migration)
-- user_id bleibt erhalten (Angelegt-von), Sicherheitsgrenze ist company_id
-- =============================================================================

ALTER TABLE public.kunden
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE;

ALTER TABLE public.emails
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE;

ALTER TABLE public.angebote
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE;

ALTER TABLE public.termine
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE;

UPDATE public.kunden k
SET company_id = p.company_id
FROM public.profiles p
WHERE p.id = k.user_id AND k.company_id IS NULL;

UPDATE public.emails e
SET company_id = p.company_id
FROM public.profiles p
WHERE p.id = e.user_id AND e.company_id IS NULL;

UPDATE public.angebote a
SET company_id = p.company_id
FROM public.profiles p
WHERE p.id = a.user_id AND a.company_id IS NULL;

UPDATE public.termine t
SET company_id = p.company_id
FROM public.profiles p
WHERE p.id = t.user_id AND t.company_id IS NULL;

UPDATE public.tasks t
SET company_id = p.company_id
FROM public.profiles p
WHERE p.id = t.user_id AND t.company_id IS NULL;

ALTER TABLE public.kunden    ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.emails    ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.angebote  ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.termine   ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.tasks     ALTER COLUMN company_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kunden_company_id ON public.kunden (company_id);
CREATE INDEX IF NOT EXISTS idx_emails_company_id ON public.emails (company_id);
CREATE INDEX IF NOT EXISTS idx_angebote_company_id ON public.angebote (company_id);
CREATE INDEX IF NOT EXISTS idx_termine_company_id ON public.termine (company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON public.tasks (company_id);

ALTER TABLE public.angebote DROP CONSTRAINT IF EXISTS angebote_user_nr_unique;
ALTER TABLE public.angebote
  ADD CONSTRAINT angebote_company_nr_unique UNIQUE (company_id, angebot_nr);

CREATE OR REPLACE FUNCTION public.enforce_kunde_company_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.kunde_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.kunden
      WHERE id = NEW.kunde_id
        AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'kunde_id gehört nicht zur gleichen Firma';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_email_company_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.emails
      WHERE id = NEW.email_id
        AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'email_id gehört nicht zur gleichen Firma';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS emails_enforce_kunde_ownership ON public.emails;
DROP TRIGGER IF EXISTS angebote_enforce_kunde_ownership ON public.angebote;
DROP TRIGGER IF EXISTS termine_enforce_kunde_ownership ON public.termine;
DROP TRIGGER IF EXISTS tasks_enforce_email_ownership ON public.tasks;

CREATE TRIGGER emails_enforce_kunde_company_scope
  BEFORE INSERT OR UPDATE OF kunde_id, company_id ON public.emails
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kunde_company_scope();

CREATE TRIGGER angebote_enforce_kunde_company_scope
  BEFORE INSERT OR UPDATE OF kunde_id, company_id ON public.angebote
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kunde_company_scope();

CREATE TRIGGER termine_enforce_kunde_company_scope
  BEFORE INSERT OR UPDATE OF kunde_id, company_id ON public.termine
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kunde_company_scope();

CREATE TRIGGER tasks_enforce_email_company_scope
  BEFORE INSERT OR UPDATE OF email_id, company_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_email_company_scope();

DROP POLICY IF EXISTS "kunden_select_own" ON public.kunden;
DROP POLICY IF EXISTS "kunden_insert_own" ON public.kunden;
DROP POLICY IF EXISTS "kunden_update_own" ON public.kunden;
DROP POLICY IF EXISTS "kunden_delete_own" ON public.kunden;

CREATE POLICY "kunden_select_company"
  ON public.kunden FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY "kunden_insert_company"
  ON public.kunden FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "kunden_update_company"
  ON public.kunden FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "kunden_delete_company"
  ON public.kunden FOR DELETE TO authenticated
  USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "emails_select_own" ON public.emails;
DROP POLICY IF EXISTS "emails_insert_own" ON public.emails;
DROP POLICY IF EXISTS "emails_update_own" ON public.emails;
DROP POLICY IF EXISTS "emails_delete_own" ON public.emails;

CREATE POLICY "emails_select_company"
  ON public.emails FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY "emails_insert_company"
  ON public.emails FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "emails_update_company"
  ON public.emails FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "emails_delete_company"
  ON public.emails FOR DELETE TO authenticated
  USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "angebote_select_own" ON public.angebote;
DROP POLICY IF EXISTS "angebote_insert_own" ON public.angebote;
DROP POLICY IF EXISTS "angebote_update_own" ON public.angebote;
DROP POLICY IF EXISTS "angebote_delete_own" ON public.angebote;

CREATE POLICY "angebote_select_company"
  ON public.angebote FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY "angebote_insert_company"
  ON public.angebote FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "angebote_update_company"
  ON public.angebote FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "angebote_delete_company"
  ON public.angebote FOR DELETE TO authenticated
  USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "angebotspositionen_select_own" ON public.angebotspositionen;
DROP POLICY IF EXISTS "angebotspositionen_insert_own" ON public.angebotspositionen;
DROP POLICY IF EXISTS "angebotspositionen_update_own" ON public.angebotspositionen;
DROP POLICY IF EXISTS "angebotspositionen_delete_own" ON public.angebotspositionen;

CREATE POLICY "angebotspositionen_select_company"
  ON public.angebotspositionen FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.company_id = public.current_user_company_id()
    )
  );

CREATE POLICY "angebotspositionen_insert_company"
  ON public.angebotspositionen FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.company_id = public.current_user_company_id()
    )
  );

CREATE POLICY "angebotspositionen_update_company"
  ON public.angebotspositionen FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.company_id = public.current_user_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.company_id = public.current_user_company_id()
    )
  );

CREATE POLICY "angebotspositionen_delete_company"
  ON public.angebotspositionen FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.company_id = public.current_user_company_id()
    )
  );

DROP POLICY IF EXISTS "termine_select_own" ON public.termine;
DROP POLICY IF EXISTS "termine_insert_own" ON public.termine;
DROP POLICY IF EXISTS "termine_update_own" ON public.termine;
DROP POLICY IF EXISTS "termine_delete_own" ON public.termine;

CREATE POLICY "termine_select_company"
  ON public.termine FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY "termine_insert_company"
  ON public.termine FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "termine_update_company"
  ON public.termine FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "termine_delete_company"
  ON public.termine FOR DELETE TO authenticated
  USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_own" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_own" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_own" ON public.tasks;

CREATE POLICY "tasks_select_company"
  ON public.tasks FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY "tasks_insert_company"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "tasks_update_company"
  ON public.tasks FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "tasks_delete_company"
  ON public.tasks FOR DELETE TO authenticated
  USING (company_id = public.current_user_company_id());

NOTIFY pgrst, 'reload schema';
