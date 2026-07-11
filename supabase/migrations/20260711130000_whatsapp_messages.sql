-- =============================================================================
-- HELPY WhatsApp Business — Verbindungen + Nachrichten-Inbox (pro Unternehmen)
-- =============================================================================

CREATE TYPE public.whatsapp_message_status AS ENUM (
  'neu',
  'in_bearbeitung',
  'erledigt',
  'archiviert'
);

CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  phone_number_id   TEXT NOT NULL,
  display_number    TEXT,
  waba_id           TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  connected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT whatsapp_connections_phone_number_id_unique UNIQUE (phone_number_id),
  CONSTRAINT whatsapp_connections_company_unique UNIQUE (company_id)
);

COMMENT ON TABLE public.whatsapp_connections IS
  'Meta phone_number_id → Mandant. Webhook-Routing und Verbindungsstatus in der UI.';

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  message_id          TEXT NOT NULL,
  from_number         TEXT NOT NULL,
  from_name           TEXT,
  body                TEXT NOT NULL DEFAULT '',
  message_type        TEXT NOT NULL DEFAULT 'text',
  status              public.whatsapp_message_status NOT NULL DEFAULT 'neu',
  intent_type         TEXT,
  intent_label        TEXT,
  priority            TEXT,
  summary             TEXT,
  recommended_action  TEXT,
  customer_id         UUID REFERENCES public.kunden (id) ON DELETE SET NULL,
  received_at         TIMESTAMPTZ NOT NULL,
  classified_at       TIMESTAMPTZ,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT whatsapp_messages_company_message_unique UNIQUE (company_id, message_id)
);

COMMENT ON TABLE public.whatsapp_messages IS
  'WhatsApp-Inbox getrennt von Mail-Vorgängen. Webhook schreibt via service role.';

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_company_status
  ON public.whatsapp_messages (company_id, status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_company_received
  ON public.whatsapp_messages (company_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number
  ON public.whatsapp_messages (company_id, from_number);

CREATE OR REPLACE FUNCTION public.set_whatsapp_connections_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS whatsapp_connections_set_updated_at ON public.whatsapp_connections;
CREATE TRIGGER whatsapp_connections_set_updated_at
  BEFORE UPDATE ON public.whatsapp_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_whatsapp_connections_updated_at();

CREATE OR REPLACE FUNCTION public.set_whatsapp_messages_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS whatsapp_messages_set_updated_at ON public.whatsapp_messages;
CREATE TRIGGER whatsapp_messages_set_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_whatsapp_messages_updated_at();

ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY whatsapp_connections_select ON public.whatsapp_connections
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY whatsapp_connections_insert ON public.whatsapp_connections
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY whatsapp_connections_update ON public.whatsapp_connections
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY whatsapp_messages_select ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY whatsapp_messages_update ON public.whatsapp_messages
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());
