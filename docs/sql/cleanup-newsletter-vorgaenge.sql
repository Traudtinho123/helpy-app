-- Sofort-Bereinigung: Newsletter-Vorgänge (XING News, BMW/Rekordschulden, etc.)
-- Supabase SQL Editor — vor dem Löschen optional Vorschau ausführen.

-- Vorschau:
-- SELECT id, titel, absender_name, absender_email, created_at
-- FROM public.vorgaenge
-- WHERE titel ILIKE '%Rekordschulden%'
--    OR titel ILIKE '%BMW%Krise%'
--    OR titel ILIKE '%xing%'
--    OR absender_name = 'System';

DELETE FROM public.vorgaenge
WHERE titel ILIKE '%Rekordschulden%'
   OR titel ILIKE '%BMW%Krise%';
