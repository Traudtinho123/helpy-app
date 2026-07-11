-- Lead-Scoring: regelbasiertes Score-Feld pro Kunde (1–10)
ALTER TABLE public.kunden
  ADD COLUMN IF NOT EXISTS score_value INT,
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ;

ALTER TABLE public.kunden
  DROP CONSTRAINT IF EXISTS kunden_score_value_range;

ALTER TABLE public.kunden
  ADD CONSTRAINT kunden_score_value_range
  CHECK (score_value IS NULL OR (score_value >= 1 AND score_value <= 10));

COMMENT ON COLUMN public.kunden.score_value IS 'Lead-Score 1 (kalt) bis 10 (heiss), regelbasiert';
COMMENT ON COLUMN public.kunden.score_updated_at IS 'Zeitpunkt der letzten Score-Berechnung';

CREATE INDEX IF NOT EXISTS idx_kunden_company_score
  ON public.kunden (company_id, score_value DESC NULLS LAST)
  WHERE score_value IS NOT NULL;
