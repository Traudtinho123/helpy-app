-- Team-Einladungen (pending bis erster Login)

CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  accepted_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT team_invites_role_check CHECK (role IN ('admin', 'member')),
  CONSTRAINT team_invites_status_check CHECK (
    status IN ('pending', 'accepted', 'cancelled')
  ),
  CONSTRAINT team_invites_email_company_unique UNIQUE (company_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_invites_company
  ON public.team_invites (company_id, status);

CREATE INDEX IF NOT EXISTS idx_team_invites_email
  ON public.team_invites (lower(email));

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_invites_service ON public.team_invites;
CREATE POLICY team_invites_service ON public.team_invites
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
