-- =============================================================================
-- HELPY — Alle Migrationen im Supabase SQL Editor ausführen
-- Projekt: dpfhqypyeaytyxardoke
--
-- Anleitung:
-- 1. Supabase Dashboard → SQL Editor → New query
-- 2. Gesamten Inhalt dieser Datei einfügen und „Run“ klicken
-- 3. Danach Schritt „Backfill + Freischaltung“ unten ausführen (E-Mail anpassen)
--
-- Reihenfolge: Basis-Schema → completed_vorgaenge → allowed_skills
-- =============================================================================

-- ─── TEIL 1: Basis-Schema (20260706150000_helpy_office_schema.sql) ─────────

-- =============================================================================
-- HELPY Office KI — Initiales Datenmodell
-- Produktionsreife Migration mit RLS, Policies, Foreign Keys und Indexes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.email_status AS ENUM (
  'neu',
  'gelesen',
  'beantwortet',
  'archiviert'
);

CREATE TYPE public.prioritaet AS ENUM (
  'hoch',
  'mittel',
  'niedrig'
);

CREATE TYPE public.angebot_status AS ENUM (
  'entwurf',
  'warten_auf_freigabe',
  'gesendet',
  'angenommen',
  'abgelehnt'
);

CREATE TYPE public.termin_status AS ENUM (
  'geplant',
  'bestaetigt',
  'abgeschlossen',
  'abgesagt'
);

-- ---------------------------------------------------------------------------
-- profiles — 1:1 mit auth.users
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  firma       TEXT,
  vorname     TEXT,
  nachname    TEXT,
  telefon     TEXT,
  sprache     TEXT        NOT NULL DEFAULT 'de',
  logo_url    TEXT,
  erstellt_am TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT profiles_sprache_length CHECK (char_length(sprache) BETWEEN 2 AND 10)
);

COMMENT ON TABLE public.profiles IS 'Benutzerprofil — Mandantendaten pro HELPY-Nutzer';
COMMENT ON COLUMN public.profiles.id IS 'Referenz auf auth.users.id';

-- ---------------------------------------------------------------------------
-- kunden
-- ---------------------------------------------------------------------------

CREATE TABLE public.kunden (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  firmenname      TEXT        NOT NULL,
  ansprechpartner TEXT,
  email           TEXT,
  telefon         TEXT,
  adresse         TEXT,
  ust_id          TEXT,
  notizen         TEXT,
  erstellt_am     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT kunden_firmenname_not_empty CHECK (char_length(trim(firmenname)) > 0),
  CONSTRAINT kunden_email_format CHECK (
    email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

COMMENT ON TABLE public.kunden IS 'Kundenstamm — mandantenfähig pro user_id';

-- ---------------------------------------------------------------------------
-- emails
-- ---------------------------------------------------------------------------

CREATE TABLE public.emails (
  id             UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID               NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kunde_id       UUID               REFERENCES public.kunden (id) ON DELETE SET NULL,
  betreff        TEXT               NOT NULL,
  absender       TEXT               NOT NULL,
  empfaenger     TEXT,
  inhalt         TEXT,
  zusammenfassung TEXT,
  status         public.email_status NOT NULL DEFAULT 'neu',
  prioritaet     public.prioritaet  NOT NULL DEFAULT 'mittel',
  antwort        TEXT,
  erstellt_am    TIMESTAMPTZ        NOT NULL DEFAULT now(),

  CONSTRAINT emails_betreff_not_empty CHECK (char_length(trim(betreff)) > 0),
  CONSTRAINT emails_absender_not_empty CHECK (char_length(trim(absender)) > 0)
);

COMMENT ON TABLE public.emails IS 'Posteingang — E-Mails mit KI-Zusammenfassung und Antwortentwurf';

-- ---------------------------------------------------------------------------
-- angebote
-- ---------------------------------------------------------------------------

CREATE TABLE public.angebote (
  id          UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID                  NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kunde_id    UUID                  REFERENCES public.kunden (id) ON DELETE SET NULL,
  angebot_nr  TEXT                  NOT NULL,
  status      public.angebot_status NOT NULL DEFAULT 'entwurf',
  netto       NUMERIC(12, 2),
  brutto      NUMERIC(12, 2),
  pdf_url     TEXT,
  erstellt_am TIMESTAMPTZ           NOT NULL DEFAULT now(),

  CONSTRAINT angebote_angebot_nr_not_empty CHECK (char_length(trim(angebot_nr)) > 0),
  CONSTRAINT angebote_netto_non_negative CHECK (netto IS NULL OR netto >= 0),
  CONSTRAINT angebote_brutto_non_negative CHECK (brutto IS NULL OR brutto >= 0),
  CONSTRAINT angebote_brutto_gte_netto CHECK (
    netto IS NULL OR brutto IS NULL OR brutto >= netto
  ),
  CONSTRAINT angebote_user_nr_unique UNIQUE (user_id, angebot_nr)
);

COMMENT ON TABLE public.angebote IS 'Angebote — Kopfdaten inkl. Status und PDF-Referenz';

-- ---------------------------------------------------------------------------
-- angebotspositionen
-- ---------------------------------------------------------------------------

CREATE TABLE public.angebotspositionen (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  angebot_id  UUID          NOT NULL REFERENCES public.angebote (id) ON DELETE CASCADE,
  bezeichnung TEXT          NOT NULL,
  menge       NUMERIC(12, 3) NOT NULL DEFAULT 1,
  einzelpreis NUMERIC(12, 2) NOT NULL,
  mwst        NUMERIC(5, 2) NOT NULL DEFAULT 19.00,

  CONSTRAINT angebotspositionen_bezeichnung_not_empty CHECK (char_length(trim(bezeichnung)) > 0),
  CONSTRAINT angebotspositionen_menge_positive CHECK (menge > 0),
  CONSTRAINT angebotspositionen_einzelpreis_non_negative CHECK (einzelpreis >= 0),
  CONSTRAINT angebotspositionen_mwst_range CHECK (mwst >= 0 AND mwst <= 100)
);

COMMENT ON TABLE public.angebotspositionen IS 'Angebotspositionen — Positionen je Angebot';
COMMENT ON COLUMN public.angebotspositionen.mwst IS 'MwSt.-Satz in Prozent (z. B. 19.00)';

-- ---------------------------------------------------------------------------
-- termine
-- ---------------------------------------------------------------------------

CREATE TABLE public.termine (
  id        UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID                 NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kunde_id  UUID                 REFERENCES public.kunden (id) ON DELETE SET NULL,
  titel     TEXT                 NOT NULL,
  ort       TEXT,
  start     TIMESTAMPTZ          NOT NULL,
  ende      TIMESTAMPTZ,
  status    public.termin_status NOT NULL DEFAULT 'geplant',

  CONSTRAINT termine_titel_not_empty CHECK (char_length(trim(titel)) > 0),
  CONSTRAINT termine_ende_after_start CHECK (ende IS NULL OR ende >= start)
);

COMMENT ON TABLE public.termine IS 'Kalendertermine — optional verknüpft mit Kunden';

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------

CREATE TABLE public.tasks (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID              NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email_id     UUID              REFERENCES public.emails (id) ON DELETE SET NULL,
  beschreibung TEXT              NOT NULL,
  erledigt     BOOLEAN           NOT NULL DEFAULT false,
  prioritaet   public.prioritaet NOT NULL DEFAULT 'mittel',

  CONSTRAINT tasks_beschreibung_not_empty CHECK (char_length(trim(beschreibung)) > 0)
);

COMMENT ON TABLE public.tasks IS 'Aufgaben — optional aus E-Mails abgeleitet';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_profiles_erstellt_am ON public.profiles (erstellt_am DESC);

CREATE INDEX idx_kunden_user_id ON public.kunden (user_id);
CREATE INDEX idx_kunden_user_erstellt ON public.kunden (user_id, erstellt_am DESC);
CREATE INDEX idx_kunden_user_firmenname ON public.kunden (user_id, firmenname);
CREATE INDEX idx_kunden_email ON public.kunden (user_id, email) WHERE email IS NOT NULL;

CREATE INDEX idx_emails_user_id ON public.emails (user_id);
CREATE INDEX idx_emails_kunde_id ON public.emails (kunde_id) WHERE kunde_id IS NOT NULL;
CREATE INDEX idx_emails_user_status ON public.emails (user_id, status);
CREATE INDEX idx_emails_user_prioritaet ON public.emails (user_id, prioritaet);
CREATE INDEX idx_emails_user_erstellt ON public.emails (user_id, erstellt_am DESC);

CREATE INDEX idx_angebote_user_id ON public.angebote (user_id);
CREATE INDEX idx_angebote_kunde_id ON public.angebote (kunde_id) WHERE kunde_id IS NOT NULL;
CREATE INDEX idx_angebote_user_status ON public.angebote (user_id, status);
CREATE INDEX idx_angebote_user_erstellt ON public.angebote (user_id, erstellt_am DESC);

CREATE INDEX idx_angebotspositionen_angebot_id ON public.angebotspositionen (angebot_id);

CREATE INDEX idx_termine_user_id ON public.termine (user_id);
CREATE INDEX idx_termine_kunde_id ON public.termine (kunde_id) WHERE kunde_id IS NOT NULL;
CREATE INDEX idx_termine_user_start ON public.termine (user_id, start);
CREATE INDEX idx_termine_user_status ON public.termine (user_id, status);

CREATE INDEX idx_tasks_user_id ON public.tasks (user_id);
CREATE INDEX idx_tasks_email_id ON public.tasks (email_id) WHERE email_id IS NOT NULL;
CREATE INDEX idx_tasks_user_offen ON public.tasks (user_id, prioritaet) WHERE erledigt = false;

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: Kunde muss demselben Nutzer gehören (emails, angebote, termine)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_kunde_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.kunde_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.kunden
      WHERE id = NEW.kunde_id
        AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'kunde_id gehört nicht zum aktuellen Nutzer';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER emails_enforce_kunde_ownership
  BEFORE INSERT OR UPDATE OF kunde_id, user_id ON public.emails
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kunde_ownership();

CREATE TRIGGER angebote_enforce_kunde_ownership
  BEFORE INSERT OR UPDATE OF kunde_id, user_id ON public.angebote
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kunde_ownership();

CREATE TRIGGER termine_enforce_kunde_ownership
  BEFORE INSERT OR UPDATE OF kunde_id, user_id ON public.termine
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kunde_ownership();

-- ---------------------------------------------------------------------------
-- Trigger: E-Mail muss demselben Nutzer gehören (tasks)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_email_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.emails
      WHERE id = NEW.email_id
        AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'email_id gehört nicht zum aktuellen Nutzer';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_enforce_email_ownership
  BEFORE INSERT OR UPDATE OF email_id, user_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_email_ownership();

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

-- profiles
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- kunden
CREATE POLICY "kunden_select_own"
  ON public.kunden
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "kunden_insert_own"
  ON public.kunden
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kunden_update_own"
  ON public.kunden
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kunden_delete_own"
  ON public.kunden
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- emails
CREATE POLICY "emails_select_own"
  ON public.emails
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "emails_insert_own"
  ON public.emails
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails_update_own"
  ON public.emails
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails_delete_own"
  ON public.emails
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- angebote
CREATE POLICY "angebote_select_own"
  ON public.angebote
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "angebote_insert_own"
  ON public.angebote
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "angebote_update_own"
  ON public.angebote
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "angebote_delete_own"
  ON public.angebote
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- angebotspositionen (Zugriff über Angebot-Besitz)
CREATE POLICY "angebotspositionen_select_own"
  ON public.angebotspositionen
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.user_id = auth.uid()
    )
  );

CREATE POLICY "angebotspositionen_insert_own"
  ON public.angebotspositionen
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.user_id = auth.uid()
    )
  );

CREATE POLICY "angebotspositionen_update_own"
  ON public.angebotspositionen
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.user_id = auth.uid()
    )
  );

CREATE POLICY "angebotspositionen_delete_own"
  ON public.angebotspositionen
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.angebote
      WHERE angebote.id = angebotspositionen.angebot_id
        AND angebote.user_id = auth.uid()
    )
  );

-- termine
CREATE POLICY "termine_select_own"
  ON public.termine
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "termine_insert_own"
  ON public.termine
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "termine_update_own"
  ON public.termine
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "termine_delete_own"
  ON public.termine
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- tasks
CREATE POLICY "tasks_select_own"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_own"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_own"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_delete_own"
  ON public.tasks
  FOR DELETE
  TO authenticated
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

GRANT USAGE ON TYPE public.email_status TO authenticated;
GRANT USAGE ON TYPE public.prioritaet TO authenticated;
GRANT USAGE ON TYPE public.angebot_status TO authenticated;
GRANT USAGE ON TYPE public.termin_status TO authenticated;

-- ─── TEIL 2: completed_vorgaenge (20260709120000_completed_vorgaenge.sql) ──

-- =============================================================================
-- Persistente Vorgangszustände (completed_vorgaenge)
-- Erledigte Vorgänge überleben Reload, Logout/Login und Server-Neustart.
-- Reaktivierung nur bei neuerer eingehender Kundenmail im gleichen Thread.
--
-- Supabase SQL Editor: gesamten Inhalt ausführen, danach App neu laden.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.completed_vorgaenge (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_completed_vorgaenge_provider_thread_company
  ON public.completed_vorgaenge (provider, provider_thread_id, company_id);

CREATE INDEX IF NOT EXISTS idx_completed_vorgaenge_user_status
  ON public.completed_vorgaenge (user_id, status);

CREATE INDEX IF NOT EXISTS idx_completed_vorgaenge_user_updated
  ON public.completed_vorgaenge (user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_completed_vorgaenge_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS completed_vorgaenge_set_updated_at ON public.completed_vorgaenge;
CREATE TRIGGER completed_vorgaenge_set_updated_at
  BEFORE UPDATE ON public.completed_vorgaenge
  FOR EACH ROW
  EXECUTE FUNCTION public.set_completed_vorgaenge_updated_at();

ALTER TABLE public.completed_vorgaenge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "completed_vorgaenge_select_own" ON public.completed_vorgaenge;
CREATE POLICY "completed_vorgaenge_select_own"
  ON public.completed_vorgaenge
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "completed_vorgaenge_insert_own" ON public.completed_vorgaenge;
CREATE POLICY "completed_vorgaenge_insert_own"
  ON public.completed_vorgaenge
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "completed_vorgaenge_update_own" ON public.completed_vorgaenge;
CREATE POLICY "completed_vorgaenge_update_own"
  ON public.completed_vorgaenge
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "completed_vorgaenge_delete_own" ON public.completed_vorgaenge;
CREATE POLICY "completed_vorgaenge_delete_own"
  ON public.completed_vorgaenge
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.completed_vorgaenge TO authenticated;

-- Schema-Cache für PostgREST aktualisieren
NOTIFY pgrst, 'reload schema';

-- ─── TEIL 3: Skill-Freischaltung (20260709140000_profile_allowed_skills.sql) ─

-- =============================================================================
-- HELPY: Freigeschaltete Skills pro Nutzer (manuelle Freischaltung nach Zahlung)
-- =============================================================================

-- Enum verhindert Tippfehler im Supabase Table Editor (Dropdown statt Freitext).
CREATE TYPE public.helpy_skill AS ENUM (
  'real-estate',
  'construction',
  'consulting-legal'
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allowed_skills public.helpy_skill[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.profiles.allowed_skills IS
  'Freigeschaltete HELPY-Skills nach manueller Zahlung. Leer = Zugang noch nicht freigeschaltet. Array für spätere Multi-Skill-Erweiterung; aktuell max. 1 Eintrag.';

-- Vorerst nur ein Skill pro Konto (Constraint später lockern für Multi-Skill).
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_allowed_skills_max_one;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_allowed_skills_max_one
  CHECK (cardinality(allowed_skills) <= 1);

-- Nutzer dürfen allowed_skills nicht selbst ändern (nur service_role / Dashboard).
CREATE OR REPLACE FUNCTION public.protect_allowed_skills()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Erlaubt: service_role (Dashboard) und direkte SQL ohne Auth-Kontext (SQL Editor).
  -- Blockiert: authentifizierte App-Nutzer, die das Feld selbst ändern wollen.
  IF NEW.allowed_skills IS DISTINCT FROM OLD.allowed_skills THEN
    IF auth.uid() IS NOT NULL
       AND coalesce(auth.role(), '') IS DISTINCT FROM 'service_role' THEN
      RAISE EXCEPTION
        'allowed_skills darf nur vom Betreiber (Supabase Dashboard / service_role) gesetzt werden';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_allowed_skills ON public.profiles;

CREATE TRIGGER profiles_protect_allowed_skills
  BEFORE UPDATE OF allowed_skills ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_allowed_skills();

-- ─── TEIL 4: Backfill — Profile für bestehende auth.users anlegen ────────────
-- (Nutzer, die sich registriert haben, bevor die Migration lief)

INSERT INTO public.profiles (id, sprache)
SELECT u.id, 'de'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- ─── TEIL 5: Skill freischalten (E-Mail anpassen, dann ausführen) ────────────

-- UPDATE public.profiles
-- SET allowed_skills = ARRAY['real-estate']::public.helpy_skill[]
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'deine@email.de'
-- );

-- Schema-Cache für PostgREST aktualisieren
NOTIFY pgrst, 'reload schema';
