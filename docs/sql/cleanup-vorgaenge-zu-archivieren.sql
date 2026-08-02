-- Bestehende Spam/System-Vorgänge nach "zu_archivieren" verschieben
-- Vorschau zuerst ausführen, dann UPDATE.

-- Vorschau
SELECT id, titel, absender_name, absender_email, status, created_at
FROM public.vorgaenge
WHERE status NOT IN ('erledigt', 'archiviert', 'zu_archivieren')
  AND (
    absender_name IN ('System', 'Unbekannt', 'Kein Absender')
    OR absender_email IS NULL
    OR absender_email ILIKE '%newsletter%'
    OR absender_email ILIKE '%noreply%'
    OR absender_email ILIKE '%no-reply%'
    OR absender_email ILIKE '%marketing%'
    OR titel ILIKE '%rabatt%'
    OR titel ILIKE '%sale%'
    OR titel ILIKE '%newsletter%'
    OR titel ILIKE '%angebot%'
    OR titel ILIKE '%werbung%'
    OR titel ILIKE '%gutschein%'
    OR titel ILIKE '%% off%'
    OR titel ILIKE '%rekordschulden%'
    OR titel ILIKE '%BMW%Krise%'
    OR titel ILIKE '%haushaltshelfer%'
    OR titel ILIKE '%JIRA%'
    OR titel ILIKE '%ASANA%'
    OR titel ILIKE '%eingetroffen%'
  )
ORDER BY created_at DESC
LIMIT 100;

-- Bereinigung
UPDATE public.vorgaenge
SET
  status = 'zu_archivieren',
  archiv_kategorie = COALESCE(archiv_kategorie, 'spam'),
  updated_at = now()
WHERE status NOT IN ('erledigt', 'archiviert', 'zu_archivieren')
  AND (
    absender_name IN ('System', 'Unbekannt', 'Kein Absender')
    OR absender_email IS NULL
    OR absender_email ILIKE '%newsletter%'
    OR absender_email ILIKE '%noreply%'
    OR absender_email ILIKE '%no-reply%'
    OR absender_email ILIKE '%marketing%'
    OR titel ILIKE '%rabatt%'
    OR titel ILIKE '%sale%'
    OR titel ILIKE '%newsletter%'
    OR titel ILIKE '%angebot%'
    OR titel ILIKE '%werbung%'
    OR titel ILIKE '%gutschein%'
    OR titel ILIKE '%% off%'
    OR titel ILIKE '%rekordschulden%'
    OR titel ILIKE '%BMW%Krise%'
    OR titel ILIKE '%haushaltshelfer%'
    OR titel ILIKE '%JIRA%'
    OR titel ILIKE '%ASANA%'
    OR titel ILIKE '%eingetroffen%'
  );
