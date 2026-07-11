-- Kunden-Status für CRM (Interessent / Aktiv / Bestandskunde)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kunde_status') THEN
    CREATE TYPE public.kunde_status AS ENUM (
      'interessent',
      'aktiv',
      'bestandskunde'
    );
  END IF;
END $$;

ALTER TABLE public.kunden
  ADD COLUMN IF NOT EXISTS status public.kunde_status NOT NULL DEFAULT 'interessent';

COMMENT ON COLUMN public.kunden.status IS
  'CRM-Status: interessent (Standard), aktiv, bestandskunde';

CREATE INDEX IF NOT EXISTS idx_kunden_company_email
  ON public.kunden (company_id, lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kunden_company_telefon
  ON public.kunden (company_id, telefon)
  WHERE telefon IS NOT NULL;
