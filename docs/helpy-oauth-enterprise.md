# HELPY Enterprise OAuth v1

## Ziel

Endkunden verbinden Gmail und Outlook **nur innerhalb von HELPY** — ohne Azure, Google Cloud oder Redirect-URI-Konfiguration auf Kundenseite.

## Architektur

```
Plattformen UI
    ↓
/api/oauth/{google|microsoft}/start
    ↓
Provider Login (Google / Microsoft)
    ↓
/api/oauth/{google|microsoft}/callback
    ↓
lib/oauth/connection-repository (verschlüsselt, pro company_id)
    ↓
Mail-Core (provider + sourceAccountEmail)
```

## Mandantenfähigkeit

- Tabelle `oauth_connections` — pro **Unternehmen** (`company_id`)
- Beliebig viele Konten pro Provider (Google + Microsoft)
- Unique: `(company_id, provider, account_email)`

## Sicherheit

| Regel | Umsetzung |
|-------|-----------|
| Keine Tokens im Frontend | Sync via `/api/oauth/gmail/sync`, Outlook via Server-API |
| Keine Secrets im Browser | `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_SECRET` nur Server |
| Verschlüsselung at rest | AES-256-GCM via `HELPY_OAUTH_ENCRYPTION_KEY` |
| Kein direkter DB-Zugriff | RLS ohne Policies — nur service role |

## Env (HELPY Betrieb — einmalig)

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://app.helpy.ch/api/oauth/google/callback

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=common
MICROSOFT_OAUTH_REDIRECT_URI=https://app.helpy.ch/api/oauth/microsoft/callback

SUPABASE_SERVICE_ROLE_KEY=
HELPY_OAUTH_ENCRYPTION_KEY=
```

## Migration bestehender Flows

- **Gmail:** `provider_token` aus Supabase-Session wird bei erstem Sync nach `oauth_connections` migriert
- **Outlook:** Cookie-Tokens werden bei `/api/oauth/migrate` bzw. Connect in DB übernommen
- Legacy-Routen `/api/outlook/auth/*` bleiben als Wrapper erhalten

## API

| Route | Beschreibung |
|-------|--------------|
| `GET /api/oauth/google/start` | Gmail-Konto verbinden |
| `GET /api/oauth/microsoft/start` | Outlook-Konto verbinden |
| `GET /api/oauth/connections` | Liste (Metadaten) |
| `DELETE /api/oauth/connections/[id]` | Konto trennen |
| `POST /api/oauth/gmail/sync` | Server-Sync aller Gmail-Konten |
| `POST /api/oauth/migrate` | Legacy → DB Migration |

## UI

`/plattformen` — `MailProviderAccountsPanel` für Google und Microsoft mit:

- Account-Liste
- Weitere verbinden
- Sync / Trennen pro Konto
