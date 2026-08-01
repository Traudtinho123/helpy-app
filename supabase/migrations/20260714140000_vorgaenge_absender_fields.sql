-- Absender persistent für Vorgänge (Name + E-Mail für Antworten)

ALTER TABLE public.vorgaenge
  ADD COLUMN IF NOT EXISTS absender_name TEXT,
  ADD COLUMN IF NOT EXISTS absender_email TEXT;

COMMENT ON COLUMN public.vorgaenge.absender_name IS
  'Anzeigename des Absenders (aus Mail-From oder Plattform-Anfrage).';
COMMENT ON COLUMN public.vorgaenge.absender_email IS
  'E-Mail-Adresse des Absenders für Antworten.';

NOTIFY pgrst, 'reload schema';
