-- In-App Benachrichtigungen (HELPY Notification Center)

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  typ TEXT NOT NULL,
  titel TEXT NOT NULL,
  beschreibung TEXT,
  link TEXT,
  gelesen BOOLEAN NOT NULL DEFAULT false,
  prioritaet TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_company_unread
  ON public.notifications (company_id, gelesen, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_company_typ_link
  ON public.notifications (company_id, typ, link)
  WHERE gelesen = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_company"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY "notifications_insert_company"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "notifications_update_company"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.notifications IS
  'In-App Benachrichtigungen für Vorgänge, Mails, Kalender und Telefon';

NOTIFY pgrst, 'reload schema';
