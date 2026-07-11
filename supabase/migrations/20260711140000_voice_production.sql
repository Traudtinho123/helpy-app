-- =============================================================================
-- HELPY Voice Production — Multi-Turn-Transkript, RLS für UI, CallSid-Unique
-- =============================================================================

ALTER TABLE public.voice_calls
  ADD COLUMN IF NOT EXISTS transcript_turns JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.voice_calls.transcript_turns IS
  'Gesprächsverlauf: [{role: "caller"|"helpy", text: "...", at: "ISO8601"}]';

CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_calls_external_call_id_unique
  ON public.voice_calls (external_call_id)
  WHERE external_call_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voice_calls_active_by_company
  ON public.voice_calls (company_id, status)
  WHERE status IN ('ringing', 'in_progress');

DROP POLICY IF EXISTS "voice_calls_select_own_company" ON public.voice_calls;
CREATE POLICY "voice_calls_select_own_company"
  ON public.voice_calls
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "voice_settings_select_own_company" ON public.voice_settings;
CREATE POLICY "voice_settings_select_own_company"
  ON public.voice_settings
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_user_company_id());

GRANT SELECT ON public.voice_calls TO authenticated;
GRANT SELECT ON public.voice_settings TO authenticated;
