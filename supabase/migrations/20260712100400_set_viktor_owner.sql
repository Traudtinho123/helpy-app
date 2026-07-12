-- Viktor als Inhaber markieren (Team-Ansicht: Rolle „Inhaber“)
UPDATE public.profiles p
SET role = 'owner'
FROM auth.users u
WHERE p.id = u.id
  AND lower(u.email) = lower('viktortraudt0@gmail.com');
