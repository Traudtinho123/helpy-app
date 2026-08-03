-- List query: company + created_at DESC (Vorgänge-Liste)

CREATE INDEX IF NOT EXISTS idx_vorgaenge_company_created_at
  ON public.vorgaenge (company_id, created_at DESC);
