-- Bereinigung: Falsche Vorgänge aus System-Mails / fehlendem Absender
-- Supabase SQL Editor — Schritte nacheinander ausführen.
--
-- HINWEIS: absender_name / absender_email existieren erst nach Schritt 0.
-- Die Vorgänge-Tabelle hat kein status = 'archiviert' — System-Mails werden gelöscht.

-- ─────────────────────────────────────────────────────────────────────────────
-- SCHRITT 0 — Migration (einmalig, falls noch nicht ausgeführt)
-- Entspricht: supabase/migrations/20260714140000_vorgaenge_absender_fields.sql
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.vorgaenge
  ADD COLUMN IF NOT EXISTS absender_name TEXT,
  ADD COLUMN IF NOT EXISTS absender_email TEXT;

COMMENT ON COLUMN public.vorgaenge.absender_name IS
  'Anzeigename des Absenders (aus Mail-From oder Plattform-Anfrage).';
COMMENT ON COLUMN public.vorgaenge.absender_email IS
  'E-Mail-Adresse des Absenders für Antworten.';

NOTIFY pgrst, 'reload schema';

-- ─────────────────────────────────────────────────────────────────────────────
-- SCHRITT 1 — Betroffene Vorgänge anzeigen
-- (auch ohne gespeicherten Absender: Heuristik über Titel/Inhalt)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  id,
  titel,
  absender_name,
  absender_email,
  source AS quelle,
  status,
  gmail_message_id,
  LEFT(inhalt, 120) AS inhalt_auszug,
  created_at
FROM public.vorgaenge
WHERE
  absender_name = 'Kein Absender'
  OR absender_name IS NULL
  OR absender_email IS NULL
  OR titel ILIKE '%your code%'
  OR titel ILIKE '%verification%'
  OR titel ILIKE '%verify%'
  OR titel ILIKE '%bestätigung%'
  OR titel ILIKE '%bestaetigung%'
  OR titel ILIKE '%docusign%'
  OR titel ILIKE '%otp%'
  OR titel ILIKE '%2fa%'
  OR inhalt ILIKE '%noreply@%'
  OR inhalt ILIKE '%no-reply@%'
  OR inhalt ILIKE '%@docusign.%'
ORDER BY created_at DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- SCHRITT 2 — System-Mails löschen (Vorschau: SELECT vor DELETE prüfen!)
-- Nur Gmail-Vorgänge mit klaren System-Mail-Signalen.
-- ─────────────────────────────────────────────────────────────────────────────
-- Vorschau — welche Zeilen würden gelöscht:
SELECT
  id,
  titel,
  absender_email,
  gmail_message_id,
  created_at
FROM public.vorgaenge
WHERE source = 'gmail'
  AND (
    absender_name = 'Kein Absender'
    OR absender_email ILIKE '%noreply%'
    OR absender_email ILIKE '%no-reply%'
    OR absender_email ILIKE '%donotreply%'
    OR absender_email ILIKE '%@docusign.%'
    OR absender_email ILIKE '%@docusign.net%'
    OR absender_email ILIKE '%@stripe.com%'
    OR absender_email ILIKE '%@google.com%'
    OR absender_email ILIKE '%@accounts.google.com%'
    OR absender_email ILIKE '%@twilio.com%'
    OR absender_email ILIKE '%@vercel.com%'
    OR absender_email ILIKE '%@github.com%'
    OR absender_email ILIKE '%@supabase.com%'
    OR absender_email ILIKE '%@microsoft.com%'
    OR absender_email ILIKE '%@apple.com%'
    OR absender_email ILIKE '%@paypal.com%'
    OR titel ILIKE '%your code%'
    OR titel ILIKE '%verification code%'
    OR titel ILIKE '%verify your%'
    OR titel ILIKE '%bestätigung%'
    OR titel ILIKE '%bestaetigung%'
    OR titel ILIKE '%otp%'
    OR titel ILIKE '%2fa%'
    OR titel ILIKE '%dein code%'
    OR inhalt ILIKE '%noreply@docusign%'
    OR inhalt ILIKE '%your code is%'
  );

-- Löschen (erst ausführen wenn Vorschau stimmt):
-- DELETE FROM public.vorgaenge
-- WHERE id IN (
--   SELECT id FROM public.vorgaenge
--   WHERE source = 'gmail'
--     AND (
--       absender_name = 'Kein Absender'
--       OR absender_email ILIKE '%noreply%'
--       OR absender_email ILIKE '%no-reply%'
--       OR absender_email ILIKE '%donotreply%'
--       OR absender_email ILIKE '%@docusign.%'
--       OR absender_email ILIKE '%@docusign.net%'
--       OR absender_email ILIKE '%@stripe.com%'
--       OR absender_email ILIKE '%@google.com%'
--       OR absender_email ILIKE '%@accounts.google.com%'
--       OR absender_email ILIKE '%@twilio.com%'
--       OR absender_email ILIKE '%@vercel.com%'
--       OR absender_email ILIKE '%@github.com%'
--       OR absender_email ILIKE '%@supabase.com%'
--       OR absender_email ILIKE '%@microsoft.com%'
--       OR absender_email ILIKE '%@apple.com%'
--       OR absender_email ILIKE '%@paypal.com%'
--       OR titel ILIKE '%your code%'
--       OR titel ILIKE '%verification code%'
--       OR titel ILIKE '%verify your%'
--       OR titel ILIKE '%bestätigung%'
--       OR titel ILIKE '%bestaetigung%'
--       OR titel ILIKE '%otp%'
--       OR titel ILIKE '%2fa%'
--       OR titel ILIKE '%dein code%'
--       OR inhalt ILIKE '%noreply@docusign%'
--       OR inhalt ILIKE '%your code is%'
--     )
-- );

-- ─────────────────────────────────────────────────────────────────────────────
-- SCHRITT 3 — Verbleibende ohne Absender prüfen
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  id,
  titel,
  absender_name,
  absender_email,
  gmail_message_id,
  created_at
FROM public.vorgaenge
WHERE absender_email IS NULL
   OR absender_name = 'Kein Absender'
   OR absender_name IS NULL
ORDER BY created_at DESC;
