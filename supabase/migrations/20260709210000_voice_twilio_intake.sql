-- Phase 3: Twilio Intake — Client-Sync + Assistant-Antwort
ALTER TABLE public.voice_calls
  ADD COLUMN IF NOT EXISTS assistant_reply TEXT,
  ADD COLUMN IF NOT EXISTS processed_payload JSONB,
  ADD COLUMN IF NOT EXISTS client_ack_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_voice_calls_pending_intake
  ON public.voice_calls (company_id, started_at DESC)
  WHERE client_ack_at IS NULL AND status = 'completed';
