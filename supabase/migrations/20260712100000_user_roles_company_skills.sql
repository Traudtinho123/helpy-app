-- Rollen, Skill-Freischaltung pro Firma, Super-Admin

-- Super-Admin Flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_super_admin IS
  'HELPY Plattform-Super-Admin (Skill-Vorschau, Admin-Panel)';

-- Firmen-Registrierungsstatus
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS requested_skill TEXT;

COMMENT ON COLUMN public.companies.registration_status IS
  'pending | active | suspended';
COMMENT ON COLUMN public.companies.requested_skill IS
  'Bei Registrierung gewünschter Skill (vor Freischaltung)';

-- Rollen pro User pro Firma
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_role_check CHECK (
    role IN ('super_admin', 'admin', 'member')
  ),
  UNIQUE(user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_company ON public.user_roles (company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);

-- Freigeschaltete Skills pro Firma
CREATE TABLE IF NOT EXISTS public.company_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(company_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_company_skills_company ON public.company_skills (company_id);

-- Backfill user_roles aus profiles
INSERT INTO public.user_roles (user_id, company_id, role)
SELECT
  p.id,
  p.company_id,
  CASE
    WHEN p.is_super_admin THEN 'super_admin'
    WHEN p.role IN ('owner', 'admin') THEN 'admin'
    ELSE 'member'
  END
FROM public.profiles p
WHERE p.company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Backfill company_skills aus profiles.allowed_skills
INSERT INTO public.company_skills (company_id, skill, is_active)
SELECT DISTINCT
  p.company_id,
  unnest(p.allowed_skills)::text,
  true
FROM public.profiles p
WHERE p.company_id IS NOT NULL
  AND cardinality(p.allowed_skills) > 0
ON CONFLICT (company_id, skill) DO NOTHING;

-- Viktor als Super-Admin (nach Migration ausführen)
-- UPDATE public.profiles p
-- SET is_super_admin = true
-- FROM auth.users u
-- WHERE p.id = u.id AND lower(u.email) = lower('viktortraudt0@gmail.com');

-- RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_skills ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    public.current_user_is_super_admin()
    OR company_id = public.current_user_company_id()
  );

DROP POLICY IF EXISTS company_skills_select ON public.company_skills;
CREATE POLICY company_skills_select ON public.company_skills
  FOR SELECT TO authenticated
  USING (
    public.current_user_is_super_admin()
    OR company_id = public.current_user_company_id()
  );

-- Schreibzugriff nur service_role (API mit Admin-Client)
DROP POLICY IF EXISTS user_roles_service ON public.user_roles;
CREATE POLICY user_roles_service ON public.user_roles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS company_skills_service ON public.company_skills;
CREATE POLICY company_skills_service ON public.company_skills
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
