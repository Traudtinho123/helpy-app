-- Bereinigung: System-Absender / Newsletter-Vorgänge
-- Supabase SQL Editor — Schritte nacheinander ausführen.

-- ─────────────────────────────────────────────────────────────────────────────
-- SCHRITT 1 — Newsletter/Werbung mit Absender "System" löschen
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM public.vorgaenge
WHERE absender_name = 'System'
AND (
  titel ILIKE '%rabatt%'
  OR titel ILIKE '%sale%'
  OR titel ILIKE '%angebot%'
  OR titel ILIKE '%newsletter%'
  OR titel ILIKE '%rekordschulden%'
  OR titel ILIKE '%haushaltshelfer%'
  OR titel ILIKE '%BMW%krise%'
  OR titel ILIKE '%JIRA%'
  OR titel ILIKE '%ASANA%'
  OR titel ILIKE '%Pipefy%'
  OR titel ILIKE '%morgen%'
  OR titel ~ '^\d+%'
  OR titel ILIKE '%eingetroffen%'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SCHRITT 2 — Restliche "System"-Vorgänge: Absender aus E-Mail setzen
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.vorgaenge v
SET absender_name =
  CASE
    WHEN absender_email IS NOT NULL
    THEN absender_email
    ELSE 'Unbekannte Mail'
  END
WHERE absender_name = 'System'
AND absender_email IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- SCHRITT 3 — Vorschau: verbleibende System-Vorgänge
-- ─────────────────────────────────────────────────────────────────────────────
SELECT id, titel, absender_name, absender_email, gmail_message_id, created_at
FROM public.vorgaenge
WHERE absender_name IN ('System', 'Unbekannt', 'Kein Absender')
   OR absender_name IS NULL
ORDER BY created_at DESC;
