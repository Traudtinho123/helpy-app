-- Bereinigung: Vorgänge mit fehlendem oder falschem Absender
-- Bitte vor dem Ausführen in Supabase SQL Editor prüfen.

-- 1) Betroffene Vorgänge anzeigen
SELECT
  id,
  titel,
  absender_email,
  absender_name,
  source AS quelle,
  status,
  created_at
FROM public.vorgaenge
WHERE absender_name = 'Kein Absender'
   OR absender_name IS NULL
   OR absender_email IS NULL
ORDER BY created_at DESC;

-- 2) System-Mails archivieren (Heuristik: noreply / bekannte Domains / Code-Betreff)
UPDATE public.vorgaenge
SET
  status = 'archiviert',
  absender_name = COALESCE(absender_name, 'System-Mail'),
  updated_at = NOW()
WHERE (
    absender_name = 'Kein Absender'
    OR absender_name IS NULL
    OR absender_email IS NULL
    OR absender_email ILIKE '%noreply%'
    OR absender_email ILIKE '%no-reply%'
    OR absender_email ILIKE '%donotreply%'
    OR absender_email ILIKE '%@docusign.com'
    OR absender_email ILIKE '%@docusign.net'
    OR absender_email ILIKE '%@twilio.com'
    OR absender_email ILIKE '%@supabase.com'
    OR absender_email ILIKE '%@vercel.com'
    OR absender_email ILIKE '%@github.com'
    OR absender_email ILIKE '%@google.com'
    OR absender_email ILIKE '%@accounts.google.com'
    OR absender_email ILIKE '%@apple.com'
    OR absender_email ILIKE '%@microsoft.com'
    OR absender_email ILIKE '%@stripe.com'
    OR absender_email ILIKE '%@paypal.com'
  )
  AND (
    titel ILIKE '%code%'
    OR titel ILIKE '%verification%'
    OR titel ILIKE '%verify%'
    OR titel ILIKE '%bestätigung%'
    OR titel ILIKE '%otp%'
    OR titel ILIKE '%pin%'
    OR titel ILIKE '%your code%'
    OR titel ILIKE '%dein code%'
    OR titel ILIKE '%2fa%'
    OR absender_email ILIKE '%noreply%'
    OR absender_email ILIKE '%no-reply%'
    OR absender_email ILIKE '%donotreply%'
    OR absender_email ILIKE '%@docusign.%'
    OR absender_email ILIKE '%@stripe.com'
    OR absender_email ILIKE '%@google.com'
  );

-- 3) Verbleibende ohne Absender-E-Mail prüfen (manuell mit Gmail-Header korrigieren)
SELECT
  id,
  titel,
  absender_email,
  absender_name,
  gmail_message_id,
  created_at
FROM public.vorgaenge
WHERE absender_email IS NULL
   OR absender_name = 'Kein Absender'
ORDER BY created_at DESC;
