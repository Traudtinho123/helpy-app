-- =============================================================================
-- HELPY: Firmenstammdaten persistent in companies
-- =============================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS iban TEXT,
  ADD COLUMN IF NOT EXISTS mwst_nummer TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.companies.profile_settings IS
  'Branding, Dokumente, Signatur, MwSt., Zahlungsbedingungen (JSON).';

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_profile_settings_is_object;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_profile_settings_is_object
  CHECK (jsonb_typeof(profile_settings) = 'object');

-- Owner/Admin dürfen das eigene Unternehmen pflegen (nicht nur Platform-Operator)
CREATE OR REPLACE FUNCTION public.current_user_can_manage_company()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT role IN ('owner'::public.helpy_company_role, 'admin'::public.helpy_company_role)
      FROM public.profiles
      WHERE id = auth.uid()
        AND company_id IS NOT NULL
    ),
    false
  )
  OR public.current_user_is_platform_operator();
$$;

REVOKE ALL ON FUNCTION public.current_user_can_manage_company() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_can_manage_company() TO authenticated;

DROP POLICY IF EXISTS "companies_update_operator" ON public.companies;
DROP POLICY IF EXISTS "companies_update_member_admin" ON public.companies;

CREATE POLICY "companies_update_member_admin"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    id = public.current_user_company_id()
    AND public.current_user_can_manage_company()
  )
  WITH CHECK (
    id = public.current_user_company_id()
    AND public.current_user_can_manage_company()
  );

NOTIFY pgrst, 'reload schema';
