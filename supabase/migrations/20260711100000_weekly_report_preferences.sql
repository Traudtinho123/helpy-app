-- =============================================================================
-- HELPY: Wöchentliche Zusammenfassungs-Mail — Opt-out + Versand-Tracking
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_report_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_report_last_sent_week TEXT;

COMMENT ON COLUMN public.profiles.weekly_report_enabled IS
  'Wöchentlicher HELPY-Bericht per E-Mail (Montag 05:30 Europe/Zurich).';

COMMENT ON COLUMN public.profiles.weekly_report_last_sent_week IS
  'ISO-Kalenderwoche des letzten Versands, z.B. 2026-W27 — verhindert Doppelversand.';

NOTIFY pgrst, 'reload schema';
