-- =============================================================================
-- Fix: infinite recursion in profiles RLS (peer + companies policies)
-- Ursache: Policies lasen profiles in Subqueries → erneute RLS-Prüfung.
-- Lösung: SECURITY DEFINER Hilfsfunktionen (bypass RLS für auth.uid()-Zeile).
-- =============================================================================

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

-- profiles: Team-Kollegen lesen (ohne Rekursion)
DROP POLICY IF EXISTS "profiles_select_company_peers" ON public.profiles;
CREATE POLICY "profiles_select_company_peers"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND company_id = public.current_user_company_id()
  );

-- companies: Mitglied oder Betreiber
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

NOTIFY pgrst, 'reload schema';
