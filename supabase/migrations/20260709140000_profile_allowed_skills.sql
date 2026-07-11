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
