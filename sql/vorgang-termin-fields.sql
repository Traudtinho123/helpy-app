-- Besichtigungstermin-Felder für Vorgänge
-- Bitte in Supabase SQL Editor ausführen.

ALTER TABLE public.vorgaenge
ADD COLUMN IF NOT EXISTS termin_slots JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.vorgaenge
ADD COLUMN IF NOT EXISTS termin_bestaetigt TIMESTAMPTZ;

ALTER TABLE public.vorgaenge
ADD COLUMN IF NOT EXISTS termin_kalender_id TEXT;

ALTER TABLE public.vorgaenge
ADD COLUMN IF NOT EXISTS termin_ics_url TEXT;

COMMENT ON COLUMN public.vorgaenge.termin_slots IS
  'Die 3 vorgeschlagenen Besichtigungsslots (JSON-Array)';

COMMENT ON COLUMN public.vorgaenge.termin_bestaetigt IS
  'ISO-Zeitstempel des vom Kunden gewählten Termins';

COMMENT ON COLUMN public.vorgaenge.termin_kalender_id IS
  'Externe Kalender-Event-ID (Apple/Google) für Löschen/Bearbeiten';

COMMENT ON COLUMN public.vorgaenge.termin_ics_url IS
  'URL der .ics-Datei in Supabase Storage (optional)';
