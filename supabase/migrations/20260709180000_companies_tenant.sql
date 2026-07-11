-- =============================================================================
-- HELPY: Unternehmen (Mandanten) + Profile-Zuordnung
-- =============================================================================

CREATE TYPE public.helpy_company_role AS ENUM (
  'owner',
  'admin',
  'member'
);

CREATE TABLE IF NOT EXISTS public.companies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  industry     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT companies_name_not_empty CHECK (char_length(trim(name)) > 0)
);

COMMENT ON TABLE public.companies IS
  'HELPY-Mandant / Unternehmen — mehrere Nutzer pro company_id in profiles';

CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies (name);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies (created_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.helpy_company_role NOT NULL DEFAULT 'member';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_platform_operator BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.company_id IS
  'Zugehöriges Unternehmen (Mandant).';
COMMENT ON COLUMN public.profiles.role IS
  'Rolle im Unternehmen: owner | admin | member';
COMMENT ON COLUMN public.profiles.is_platform_operator IS
  'HELPY-Betreiber — darf Skill-Freischaltung für alle Mandanten verwalten.';

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles (company_id);

CREATE OR REPLACE FUNCTION public.set_companies_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS companies_set_updated_at ON public.companies;
CREATE TRIGGER companies_set_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_companies_updated_at();

-- Profil + Unternehmen bei Registrierung anlegen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_name TEXT;
  new_company_id UUID;
BEGIN
  company_name := NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'firma', '')), '');
  IF company_name IS NULL THEN
    company_name := COALESCE(
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 2), ''),
      'Neues Unternehmen'
    );
  END IF;

  INSERT INTO public.companies (name)
  VALUES (company_name)
  RETURNING id INTO new_company_id;

  INSERT INTO public.profiles (id, vorname, nachname, sprache, firma, company_id, role)
  VALUES (
    NEW.id,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'vorname', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'nachname', '')), ''),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'sprache'), ''), 'de'),
    company_name,
    new_company_id,
    'owner'
  );

  RETURN NEW;
END;
$$;

-- Backfill: bestehende Profile ohne company_id
DO $$
DECLARE
  profile_row RECORD;
  new_company_id UUID;
  company_label TEXT;
BEGIN
  FOR profile_row IN
    SELECT id, firma, vorname, nachname
    FROM public.profiles
    WHERE company_id IS NULL
  LOOP
    company_label := COALESCE(
      NULLIF(trim(profile_row.firma), ''),
      NULLIF(trim(both ' ' from coalesce(profile_row.vorname, '') || ' ' || coalesce(profile_row.nachname, '')), ''),
      'Unternehmen'
    );

    IF char_length(trim(company_label)) = 0 THEN
      company_label := 'Unternehmen';
    END IF;

    INSERT INTO public.companies (name)
    VALUES (company_label)
    RETURNING id INTO new_company_id;

    UPDATE public.profiles
    SET company_id = new_company_id,
        role = COALESCE(role, 'owner'::public.helpy_company_role)
    WHERE id = profile_row.id;
  END LOOP;
END;
$$;

-- RLS companies (SECURITY DEFINER helpers — keine Rekursion in profiles-Policies)
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_platform_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_platform_operator FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_company_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_platform_operator() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_platform_operator() TO authenticated;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select_member" ON public.companies;
CREATE POLICY "companies_select_member"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    id = public.current_user_company_id()
    OR public.current_user_is_platform_operator()
  );

DROP POLICY IF EXISTS "companies_update_operator" ON public.companies;
CREATE POLICY "companies_update_operator"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (public.current_user_is_platform_operator())
  WITH CHECK (public.current_user_is_platform_operator());

GRANT SELECT ON public.companies TO authenticated;
GRANT USAGE ON TYPE public.helpy_company_role TO authenticated;

DROP POLICY IF EXISTS "profiles_select_company_peers" ON public.profiles;
CREATE POLICY "profiles_select_company_peers"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND company_id = public.current_user_company_id()
  );

-- Ersten registrierten Nutzer als HELPY-Betreiber markieren (kann im Dashboard geändert werden)
UPDATE public.profiles
SET is_platform_operator = true
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
);

NOTIFY pgrst, 'reload schema';
