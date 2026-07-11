-- Termin-Extraktion + Klassifikation auf voice_calls persistieren

ALTER TABLE public.voice_calls
  ADD COLUMN IF NOT EXISTS call_classification TEXT,
  ADD COLUMN IF NOT EXISTS termin_datum DATE,
  ADD COLUMN IF NOT EXISTS termin_uhrzeit TEXT,
  ADD COLUMN IF NOT EXISTS termin_objekt TEXT;

COMMENT ON COLUMN public.voice_calls.call_classification IS
  'Post-Call GPT-Klassifikation (besichtigung_anfrage, rueckruf_wunsch, …)';
COMMENT ON COLUMN public.voice_calls.termin_datum IS
  'Erkanntes Termindatum aus dem Gespräch (YYYY-MM-DD)';
COMMENT ON COLUMN public.voice_calls.termin_uhrzeit IS
  'Erkannte Terminuhrzeit (HH:MM)';
COMMENT ON COLUMN public.voice_calls.termin_objekt IS
  'Erkanntes Objekt für Besichtigungstermin';

CREATE INDEX IF NOT EXISTS idx_voice_calls_company_classification
  ON public.voice_calls (company_id, call_classification)
  WHERE call_classification IS NOT NULL;
