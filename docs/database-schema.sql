-- =============================================================================
-- HELPY Office KI — v0.1 Datenbankschema
-- Supabase SQL Migration
--
-- Anwendung:
--   Supabase Dashboard → SQL Editor → Inhalt einfügen → Run
--   oder: supabase db execute --file docs/database-schema.sql
--
-- Voraussetzung: Supabase Auth ist aktiviert (auth.users vorhanden)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  firma      TEXT,
  vorname    TEXT,
  nachname   TEXT,
  telefon    TEXT,
  sprache    TEXT        NOT NULL DEFAULT 'de',
  logo_url   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Nutzerprofil — 1:1 mit auth.users';

-- ---------------------------------------------------------------------------
-- 2. kunden
-- ---------------------------------------------------------------------------

CREATE TABLE public.kunden (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  firmenname      TEXT        NOT NULL,
  ansprechpartner TEXT,
  email           TEXT,
  telefon         TEXT,
  adresse         TEXT,
  notizen         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.kunden IS 'Kundenstamm — mandantenfähig pro user_id';

-- ---------------------------------------------------------------------------
-- 3. emails
-- ---------------------------------------------------------------------------

CREATE TABLE public.emails (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kunde_id        UUID        REFERENCES public.kunden (id) ON DELETE SET NULL,
  betreff         TEXT,
  absender        TEXT,
  empfaenger      TEXT,
  inhalt          TEXT,
  zusammenfassung TEXT,
  status          TEXT        NOT NULL DEFAULT 'neu',
  prioritaet      TEXT        NOT NULL DEFAULT 'normal',
  antwort_entwurf TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.emails IS 'Posteingang — E-Mails mit KI-Zusammenfassung und Antwortentwurf';

-- ---------------------------------------------------------------------------
-- 4. angebote
-- ---------------------------------------------------------------------------

CREATE TABLE public.angebote (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kunde_id    UUID          REFERENCES public.kunden (id) ON DELETE SET NULL,
  angebot_nr  TEXT,
  status      TEXT          NOT NULL DEFAULT 'entwurf',
  netto       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  brutto      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  pdf_url     TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.angebote IS 'Angebote — Kopfdaten inkl. Status und PDF-Referenz';

-- ---------------------------------------------------------------------------
-- 5. angebotspositionen
-- ---------------------------------------------------------------------------

CREATE TABLE public.angebotspositionen (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  angebot_id  UUID          NOT NULL REFERENCES public.angebote (id) ON DELETE CASCADE,
  bezeichnung TEXT,
  menge       NUMERIC(12, 3) NOT NULL DEFAULT 1,
  einzelpreis NUMERIC(12, 2) NOT NULL DEFAULT 0,
  mwst        NUMERIC(5, 2)  NOT NULL DEFAULT 19
);

COMMENT ON TABLE public.angebotspositionen IS 'Positionen je Angebot';

-- ---------------------------------------------------------------------------
-- 6. termine
-- ---------------------------------------------------------------------------

CREATE TABLE public.termine (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kunde_id   UUID        REFERENCES public.kunden (id) ON DELETE SET NULL,
  titel      TEXT,
  ort        TEXT,
  start_time TIMESTAMPTZ,
  end_time   TIMESTAMPTZ,
  status     TEXT        NOT NULL DEFAULT 'geplant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT termine_end_after_start CHECK (
    end_time IS NULL OR start_time IS NULL OR end_time >= start_time
  )
);

COMMENT ON TABLE public.termine IS 'Kalendertermine — optional verknüpft mit Kunden';

-- ---------------------------------------------------------------------------
-- 7. tasks
-- ---------------------------------------------------------------------------

CREATE TABLE public.tasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email_id     UUID        REFERENCES public.emails (id) ON DELETE SET NULL,
  beschreibung TEXT,
  erledigt     BOOLEAN     NOT NULL DEFAULT false,
  prioritaet   TEXT        NOT NULL DEFAULT 'normal',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tasks IS 'Aufgaben — optional aus E-Mails abgeleitet';

-- ---------------------------------------------------------------------------
-- 8. completed_vorgaenge — persistente Vorgangszustände
-- ---------------------------------------------------------------------------

CREATE TABLE public.completed_vorgaenge (
  id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                             UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  company_id                          TEXT NOT NULL DEFAULT '',
  provider                            TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  provider_thread_id                  TEXT NOT NULL,
  provider_message_id                 TEXT,
  case_id                             TEXT,
  vorgang_id                          TEXT,
  status                              TEXT NOT NULL DEFAULT 'erledigt',
  completed_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_by                        TEXT,
  last_known_incoming_message_at      TIMESTAMPTZ,
  last_known_outgoing_message_at      TIMESTAMPTZ,
  created_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.completed_vorgaenge IS
  'Persistente Vorgangszustände — Erledigt bleibt erledigt bis neue Kundenmail im Thread';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_profiles_created_at ON public.profiles (created_at DESC);

CREATE INDEX idx_kunden_user_id ON public.kunden (user_id);
CREATE INDEX idx_kunden_user_created ON public.kunden (user_id, created_at DESC);
CREATE INDEX idx_kunden_user_firmenname ON public.kunden (user_id, firmenname);

CREATE INDEX idx_emails_user_id ON public.emails (user_id);
CREATE INDEX idx_emails_kunde_id ON public.emails (kunde_id) WHERE kunde_id IS NOT NULL;
CREATE INDEX idx_emails_user_status ON public.emails (user_id, status);
CREATE INDEX idx_emails_user_created ON public.emails (user_id, created_at DESC);

CREATE INDEX idx_angebote_user_id ON public.angebote (user_id);
CREATE INDEX idx_angebote_kunde_id ON public.angebote (kunde_id) WHERE kunde_id IS NOT NULL;
CREATE INDEX idx_angebote_user_status ON public.angebote (user_id, status);
CREATE INDEX idx_angebote_user_created ON public.angebote (user_id, created_at DESC);
CREATE UNIQUE INDEX idx_angebote_user_nr ON public.angebote (user_id, angebot_nr)
  WHERE angebot_nr IS NOT NULL;

CREATE INDEX idx_angebotspositionen_angebot_id ON public.angebotspositionen (angebot_id);

CREATE INDEX idx_termine_user_id ON public.termine (user_id);
CREATE INDEX idx_termine_kunde_id ON public.termine (kunde_id) WHERE kunde_id IS NOT NULL;
CREATE INDEX idx_termine_user_start ON public.termine (user_id, start_time);
CREATE INDEX idx_termine_user_status ON public.termine (user_id, status);

CREATE INDEX idx_tasks_user_id ON public.tasks (user_id);
CREATE INDEX idx_tasks_email_id ON public.tasks (email_id) WHERE email_id IS NOT NULL;
CREATE INDEX idx_tasks_user_offen ON public.tasks (user_id, prioritaet)
  WHERE erledigt = false;
CREATE INDEX idx_tasks_user_created ON public.tasks (user_id, created_at DESC);

CREATE UNIQUE INDEX idx_completed_vorgaenge_provider_thread_company
  ON public.completed_vorgaenge (provider, provider_thread_id, company_id);
CREATE INDEX idx_completed_vorgaenge_user_status
  ON public.completed_vorgaenge (user_id, status);
CREATE INDEX idx_completed_vorgaenge_user_updated
  ON public.completed_vorgaenge (user_id, updated_at DESC);

-- ---------------------------------------------------------------------------
-- Trigger: Profil bei Registrierung anlegen
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, vorname, nachname, sprache)
  VALUES (
    NEW.id,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'vorname', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'nachname', '')), ''),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'sprache'), ''), 'de')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: Fremd-IDs müssen demselben Nutzer gehören
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_kunde_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.kunde_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.kunden
    WHERE id = NEW.kunde_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'kunde_id gehört nicht zum aktuellen Nutzer';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER emails_enforce_kunde_ownership
  BEFORE INSERT OR UPDATE OF kunde_id, user_id ON public.emails
  FOR EACH ROW EXECUTE FUNCTION public.enforce_kunde_ownership();

CREATE TRIGGER angebote_enforce_kunde_ownership
  BEFORE INSERT OR UPDATE OF kunde_id, user_id ON public.angebote
  FOR EACH ROW EXECUTE FUNCTION public.enforce_kunde_ownership();

CREATE TRIGGER termine_enforce_kunde_ownership
  BEFORE INSERT OR UPDATE OF kunde_id, user_id ON public.termine
  FOR EACH ROW EXECUTE FUNCTION public.enforce_kunde_ownership();

CREATE OR REPLACE FUNCTION public.enforce_email_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.emails
    WHERE id = NEW.email_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'email_id gehört nicht zum aktuellen Nutzer';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_enforce_email_ownership
  BEFORE INSERT OR UPDATE OF email_id, user_id ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_email_ownership();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kunden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.angebote ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.angebotspositionen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_vorgaenge ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- kunden
CREATE POLICY "kunden_select_own"
  ON public.kunden FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "kunden_insert_own"
  ON public.kunden FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kunden_update_own"
  ON public.kunden FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kunden_delete_own"
  ON public.kunden FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- emails
CREATE POLICY "emails_select_own"
  ON public.emails FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "emails_insert_own"
  ON public.emails FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails_update_own"
  ON public.emails FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails_delete_own"
  ON public.emails FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- angebote
CREATE POLICY "angebote_select_own"
  ON public.angebote FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "angebote_insert_own"
  ON public.angebote FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "angebote_update_own"
  ON public.angebote FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "angebote_delete_own"
  ON public.angebote FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- angebotspositionen (Zugriff über Angebot-Besitz)
CREATE POLICY "angebotspositionen_select_own"
  ON public.angebotspositionen FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.user_id = auth.uid()
    )
  );

CREATE POLICY "angebotspositionen_insert_own"
  ON public.angebotspositionen FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.user_id = auth.uid()
    )
  );

CREATE POLICY "angebotspositionen_update_own"
  ON public.angebotspositionen FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.user_id = auth.uid()
    )
  );

CREATE POLICY "angebotspositionen_delete_own"
  ON public.angebotspositionen FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.user_id = auth.uid()
    )
  );

-- termine
CREATE POLICY "termine_select_own"
  ON public.termine FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "termine_insert_own"
  ON public.termine FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "termine_update_own"
  ON public.termine FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "termine_delete_own"
  ON public.termine FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- tasks
CREATE POLICY "tasks_select_own"
  ON public.tasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_own"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_own"
  ON public.tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_delete_own"
  ON public.tasks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- completed_vorgaenge
CREATE POLICY "completed_vorgaenge_select_own"
  ON public.completed_vorgaenge FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "completed_vorgaenge_insert_own"
  ON public.completed_vorgaenge FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "completed_vorgaenge_update_own"
  ON public.completed_vorgaenge FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "completed_vorgaenge_delete_own"
  ON public.completed_vorgaenge FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kunden TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emails TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.angebote TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.angebotspositionen TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.termine TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.completed_vorgaenge TO authenticated;
