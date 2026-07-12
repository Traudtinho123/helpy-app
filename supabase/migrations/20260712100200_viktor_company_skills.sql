-- Alle 9 Branchen-Skills für Viktor's Firma aktivieren (Super-Admin Vorschau)
INSERT INTO public.company_skills (company_id, skill, is_active)
SELECT
  p.company_id,
  skill_id,
  true
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
CROSS JOIN (
  VALUES
    ('real-estate'),
    ('coiffeur'),
    ('gym'),
    ('doctor'),
    ('cosmetic'),
    ('physio'),
    ('gastro'),
    ('clean'),
    ('garden')
) AS skills(skill_id)
WHERE lower(u.email) = lower('viktortraudt0@gmail.com')
  AND p.company_id IS NOT NULL
ON CONFLICT (company_id, skill) DO UPDATE
SET is_active = true,
    activated_at = COALESCE(public.company_skills.activated_at, now());
