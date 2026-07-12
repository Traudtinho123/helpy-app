-- Team-Einladungen: Admins dürfen per Session (ohne Service Role) lesen/schreiben

CREATE OR REPLACE FUNCTION public.current_user_can_invite_team()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT
        p.is_super_admin
        OR p.role IN ('owner', 'admin')
      FROM public.profiles p
      WHERE p.id = auth.uid()
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_can_invite_team() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_can_invite_team() TO authenticated;

DROP POLICY IF EXISTS team_invites_select_company ON public.team_invites;
CREATE POLICY team_invites_select_company ON public.team_invites
  FOR SELECT TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND public.current_user_can_invite_team()
  );

DROP POLICY IF EXISTS team_invites_insert_company ON public.team_invites;
CREATE POLICY team_invites_insert_company ON public.team_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND public.current_user_can_invite_team()
  );

DROP POLICY IF EXISTS team_invites_update_company ON public.team_invites;
CREATE POLICY team_invites_update_company ON public.team_invites
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND public.current_user_can_invite_team()
  )
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND public.current_user_can_invite_team()
  );
