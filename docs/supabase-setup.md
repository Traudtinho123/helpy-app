# Supabase Setup — HELPY Office KI

Kurzanleitung für Sprint 6: Supabase Auth vorbereiten.

## Benötigte Umgebungsvariablen

Kopiere `.env.local.example` nach `.env.local` und trage folgende Werte ein:

| Variable | Beschreibung |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Projekt-URL aus dem Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonyme (public) API-Key aus dem Supabase Dashboard |

```bash
cp .env.local.example .env.local
```

## Supabase URL und Anon Key finden

1. [supabase.com](https://supabase.com) → Projekt erstellen oder öffnen
2. **Project Settings** → **API**
3. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. **anon public** Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Dev-Server nach dem Eintragen neu starten:

```bash
npm run dev
```

## Ohne Keys (Demo-Modus)

Fehlen die Variablen, baut und startet die App trotzdem. Auth-Seiten zeigen einen Hinweis; das Dashboard bleibt im Demo-Modus erreichbar.

## Google OAuth (später)

Google-Anmeldung ist im Frontend vorbereitet (`signInWithGoogle`), wird aber erst aktiv, wenn OAuth in Supabase konfiguriert ist:

1. Supabase Dashboard → **Authentication** → **Providers** → **Google** aktivieren
2. Google Cloud Console: OAuth Client ID + Secret anlegen
3. **Redirect URL** in Supabase: `https://<projekt-ref>.supabase.co/auth/v1/callback`
4. In Google: Authorized redirect URI wie von Supabase angegeben
5. Callback in dieser App: `/auth/callback`

Gmail-Import und Google Calendar-Import sind **nicht** Teil von Sprint 6.

## Projektstruktur

```
lib/supabase/
  config.ts    — Env-Prüfung, isSupabaseConfigured()
  client.ts    — Browser-Client
  server.ts    — Server-Client (Cookies)

lib/auth/
  auth.ts           — signInWithEmail, signUpWithEmail, signInWithGoogle, signOut
  session.ts        — getSession, getUser, isAuthenticated
  require-auth.ts   — requireAuth() für geschützte Seiten
  routes.ts         — öffentliche/geschützte Routen

app/login/          — Anmeldeseite
app/registrieren/   — Registrierungsseite
app/auth/callback/  — OAuth Callback Route
middleware.ts       — Session-Refresh (kein harter Redirect)
```

## Geschützte Routen aktivieren (später)

Aktuell leitet die Middleware **nicht** zur Login-Seite um. Für harten Schutz später:

```tsx
// In einem Server Layout, z. B. app/(dashboard)/layout.tsx
import { requireAuth } from "@/lib/auth/require-auth";

export default async function Layout({ children }) {
  await requireAuth();
  return children;
}
```

Alternativ in `middleware.ts` bei `isProtectedRoute(pathname)` zu `/login` redirecten.

## E-Mail Auth in Supabase

Unter **Authentication** → **Providers** → **Email** aktivieren. Optional E-Mail-Bestätigung deaktivieren für lokale Entwicklung.
