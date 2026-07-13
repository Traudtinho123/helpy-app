-- Onboarding-Status für Firmen + E-Mail-Benachrichtigungen

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.companies.onboarding_completed IS
  'true wenn der 6-Schritte-Onboarding-Flow abgeschlossen ist';

COMMENT ON COLUMN public.companies.onboarding_step IS
  'Letzter abgeschlossener Onboarding-Schritt (0-6)';

CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  recipient TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_company
  ON public.email_notifications (company_id, type);
