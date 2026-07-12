-- Viktor als Super-Admin setzen (nach 20260712100000 ausführen)
UPDATE public.profiles p
SET is_super_admin = true
FROM auth.users u
WHERE p.id = u.id
  AND lower(u.email) = lower('viktortraudt0@gmail.com');

INSERT INTO public.user_roles (user_id, company_id, role)
SELECT p.id, p.company_id, 'super_admin'
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE lower(u.email) = lower('viktortraudt0@gmail.com')
  AND p.company_id IS NOT NULL
ON CONFLICT (user_id, company_id)
DO UPDATE SET role = 'super_admin';
