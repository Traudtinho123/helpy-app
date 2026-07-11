# Skill-Freischaltung (manuell nach Zahlung)

## Überblick

Nach Registrierung ist `profiles.allowed_skills` leer (`{}`).
Der Nutzer sieht `/zugang-ausstehend` und kann die App nicht nutzen.
Du schaltest nach Zahlungseingang manuell einen Skill frei.

## Betreiber-UI in HELPY (empfohlen)

**Einstellungen → Skill-Zugang** (`/einstellungen/betreiber`)

- Nur sichtbar für **HELPY-Betreiber** (`profiles.is_platform_operator` oder E-Mail in `HELPY_OPERATOR_EMAILS`)
- Links: alle **Unternehmen** (`public.companies`)
- Rechts: **Nutzerprofile** des gewählten Unternehmens
- Pro Nutzer: Skill-Dropdown (Real Estate / Construction / Consulting & Legal / gesperrt)

### Env-Variablen (`.env.local`)

```bash
# Erforderlich für E-Mail-Anzeige + Skill-Schreiben via API
SUPABASE_SERVICE_ROLE_KEY=...

# Optional: Betreiber-E-Mails (kommagetrennt)
HELPY_OPERATOR_EMAILS=deine@email.de
```

Service Role Key: Supabase Dashboard → **Project Settings → API → service_role** (secret).

## Datenmodell

```
public.companies          ← Unternehmen / Mandant
    ↑
public.profiles           ← 1 Nutzer = 1 Profil
  · company_id            ← Zugehörigkeit
  · role                  ← owner | admin | member
  · allowed_skills        ← freigeschalteter Skill
  · is_platform_operator  ← HELPY-Betreiber
```

## Fallback: Supabase Dashboard

1. **Authentication → Users**: User anhand der E-Mail finden
2. **Table Editor → `profiles`**: `allowed_skills` setzen
3. **Table Editor → `companies`**: Unternehmen anlegen / zuordnen

### SQL

```sql
UPDATE public.profiles
SET allowed_skills = ARRAY['real-estate']::public.helpy_skill[]
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'kunde@firma.de'
);
```

Freischaltung zurücknehmen:

```sql
UPDATE public.profiles
SET allowed_skills = '{}'::public.helpy_skill[]
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'kunde@firma.de'
);
```

## Absicherung

- Enum `helpy_skill` verhindert Tippfehler
- Max. 1 Skill pro Profil (Constraint)
- Trigger: App-Nutzer können `allowed_skills` nicht selbst ändern
- Betreiber-API nutzt `service_role` serverseitig

## Migration

```bash
node scripts/apply-supabase-migrations.mjs
# oder SQL aus supabase/migrations/ im SQL Editor
```
