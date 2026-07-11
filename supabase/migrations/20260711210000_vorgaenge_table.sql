-- Zentrale Vorgänge-Tabelle (Gmail, Telefon, manuell, …)

CREATE TABLE IF NOT EXISTS public.vorgaenge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  titel TEXT NOT NULL,
  inhalt TEXT NOT NULL,
  prioritaet TEXT NOT NULL DEFAULT 'mittel',
  status TEXT NOT NULL DEFAULT 'neu',
  kunden_id UUID REFERENCES public.kunden(id) ON DELETE SET NULL,
  objekt_id TEXT,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  voice_call_id UUID REFERENCES public.voice_calls(id) ON DELETE SET NULL,
  anrufer_nummer TEXT,
  termin_datum DATE,
  termin_uhrzeit TEXT,
  whatsapp_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vorgaenge_gmail_message
  ON public.vorgaenge (company_id, gmail_message_id)
  WHERE gmail_message_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vorgaenge_voice_call
  ON public.vorgaenge (voice_call_id)
  WHERE voice_call_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vorgaenge_company_source
  ON public.vorgaenge (company_id, source);

CREATE INDEX IF NOT EXISTS idx_vorgaenge_company_status
  ON public.vorgaenge (company_id, status);

COMMENT ON TABLE public.vorgaenge IS
  'Zentrale Vorgänge — Gmail, ImmoScout, HELPY Phone, manuell, WhatsApp';
COMMENT ON COLUMN public.vorgaenge.source IS
  'gmail | immoscout | homegate | helpy_phone | whatsapp | manuell';
