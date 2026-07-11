-- Leere SpeechResult-Zähler pro Anruf (serverless-sicher über DB)

ALTER TABLE public.voice_calls
  ADD COLUMN IF NOT EXISTS empty_result_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.voice_calls.empty_result_count IS
  'Aufeinanderfolgende leere Twilio SpeechResult-Ergebnisse pro Anruf.';
