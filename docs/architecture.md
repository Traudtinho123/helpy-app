# HELPY Connect — Integrationsarchitektur

## Warum HELPY Connect existiert

HELPY arbeitet als digitaler Büroassistent mit E-Mails, Terminen, Kontakten und Vorgängen. Heute nutzt die App Mock-Daten und lokale Module (`helpy-intake`, `helpy-brain`, `helpy-autopilot`). Für den Produktbetrieb müssen echte Datenquellen angebunden werden — Gmail, Outlook und Microsoft 365.

**HELPY Connect** ist die Integrationschicht zwischen externen Anbietern und der HELPY-Logik. Sie verhindert, dass Gmail- oder Microsoft-spezifischer Code in UI-Komponenten, Brain oder Intake landet. Stattdessen sprechen alle Module nur mit normalisierten Typen und Provider-Interfaces.

```
┌─────────────────────────────────────────────────────────────┐
│  UI (Dashboard, Posteingang, Kalender, Kunden)              │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  HELPY Brain · Intake · Autopilot · Workspace               │
│  (arbeitet mit NormalizedEmail, NormalizedCalendarEvent …)  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  HELPY Connect  —  lib/integrations/connect.ts              │
│  HelpyConnect: connect · disconnect · sync · Registry       │
└───────────┬─────────────────┬─────────────────┬───────────┘
            │                 │                 │
     ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
     │ Google/Gmail│   │   Outlook   │   │ Microsoft   │
     │   Service   │   │   Service   │   │ 365 Service │
     └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
            │                 │                 │
     ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
     │ Gmail API   │   │ MS Graph    │   │ MS Graph    │
     └─────────────┘   └─────────────┘   └─────────────┘
```

---

## Verzeichnisstruktur

```
lib/integrations/
├── types.ts              # Normalisierte Domain-Typen, Connection-Status
├── provider.ts           # MailProvider, CalendarProvider, ContactProvider
├── connect.ts            # HelpyConnect — zentraler Orchestrator
├── index.ts
├── google/
│   ├── oauth.ts          # Google OAuth-Konfiguration
│   └── gmail/
│       ├── client.ts     # Gmail REST Client (HTTP-Kapselung)
│       ├── service.ts    # GmailService implements MailProvider
│       └── index.ts
├── outlook/
│   ├── client.ts         # Microsoft Graph Client (Outlook)
│   ├── service.ts        # OutlookMailService, OutlookCalendarService …
│   └── index.ts
└── microsoft/
    ├── oauth.ts          # Microsoft 365 / Entra OAuth
    ├── client.ts         # MicrosoftGraphClient
    ├── service.ts        # Microsoft365Service (Mail + Calendar + Contacts)
    └── index.ts
```

---

## Provider-Interfaces

Alle Provider teilen dieselbe Verbindungs-API. Fachliche Methoden sind nach Kategorie getrennt:

| Interface | Methoden |
|-----------|----------|
| **IntegrationProvider** (Basis) | `connect()`, `disconnect()`, `sync()` |
| **MailProvider** | + `getEmails()` |
| **CalendarProvider** | + `getCalendarEvents()` |
| **ContactProvider** | + `getContacts()` |

Jede Methode liefert **normalisierte Typen** (`NormalizedEmail`, `NormalizedCalendarEvent`, `NormalizedContact`). Provider-spezifische Felder werden in den jeweiligen `service.ts`-Dateien gemappt — nicht in Brain oder UI.

Solange eine Methode noch nicht implementiert ist, wirft sie `IntegrationNotImplementedError`. Mock-Daten und bestehende UI bleiben unverändert.

---

## Wie Gmail angeschlossen wird (später)

1. **OAuth-Flow** — `google/oauth.ts` baut die Autorisierungs-URL; Callback-Route (z. B. `/api/integrations/google/callback`) tauscht den Code gegen Tokens.
2. **Token-Speicherung** — Refresh/Access Tokens werden in Supabase (verschlüsselt, pro User) persistiert — nicht im Browser-LocalStorage.
3. **GmailClient** — `gmail/client.ts` kapselt HTTP-Aufrufe an `gmail.googleapis.com`.
4. **GmailService** — `gmail/service.ts` implementiert `MailProvider`: `getEmails()` mappt Gmail-Nachrichten auf `NormalizedEmail[]`.
5. **HelpyConnect** — `helpyConnect.connect("google-gmail")` startet den Flow; `sync("google-gmail")` holt neue Mails.
6. **Brain/Intake** — erhalten Daten über Connect, nie direkt über die Gmail API.

Umgebungsvariablen (`.env.local`):

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

---

## Wie Outlook angeschlossen wird (später)

Outlook nutzt **Microsoft Graph** (`graph.microsoft.com/v1.0`):

1. **OAuth** — `outlook/client.ts` / `microsoft/oauth.ts` mit Entra ID (Tenant `common` oder organisationsspezifisch).
2. **OutlookMailService** — `GET /me/messages` → `NormalizedEmail[]`.
3. **OutlookCalendarService** — `GET /me/events` → `NormalizedCalendarEvent[]`.
4. **OutlookContactsService** — `GET /me/contacts` → `NormalizedContact[]`.

Scopes sind in `OUTLOOK_MAIL_SCOPES`, `OUTLOOK_CALENDAR_SCOPES` und `OUTLOOK_CONTACTS_SCOPES` definiert.

Umgebungsvariablen:

```
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
MICROSOFT_REDIRECT_URI=
```

---

## Microsoft 365

`Microsoft365Service` bündelt Mail, Kalender und Kontakte in einem Provider (`microsoft-365`). Sinnvoll für Kunden, die das komplette Microsoft-Ökosystem nutzen. Technisch dieselbe Graph API wie Outlook — Unterschied liegt in Scopes und Account-Kontext.

---

## Wie HELPY Brain Daten erhält

Heute:

```
Mock-Daten (lib/inbox, lib/helpy-intake) → Brain / Intake / UI
```

Zielbild:

```
HelpyConnect.sync(providerId)
    → Provider.getEmails() / getCalendarEvents() / getContacts()
    → NormalizedEmail[] / NormalizedCalendarEvent[] / NormalizedContact[]
    → helpy-intake (Erkennung) + helpy-brain (Analyse, Priorisierung)
    → UI (Dashboard, Posteingang, Kalender, Kunden)
```

**Regeln:**

- Brain importiert **keine** Gmail- oder Graph-SDKs.
- Intake arbeitet mit normalisierten Eingängen — egal ob Mock oder Gmail.
- UI ruft `helpyConnect` auf, nicht `GmailService` direkt.
- Sync kann serverseitig (API Route + Supabase) laufen; Tokens verlassen den Server nicht.

---

## HelpyConnect — API-Überblick

```typescript
import { helpyConnect } from "@/lib/integrations";

helpyConnect.registerDefaults();

await helpyConnect.connect("google-gmail");
await helpyConnect.sync("google-gmail");

const mail = helpyConnect.getMailProvider("google-gmail");
const emails = await mail?.getEmails({ limit: 50 });
```

Connection-Status und Fehler werden zentral in `IntegrationConnection` geführt — geeignet für eine spätere „Integrationen“-Einstellungsseite.

---

## Nächste Schritte (Roadmap)

| Phase | Inhalt |
|-------|--------|
| **v0** (aktuell) | Interfaces, Clients, Services als Stubs, Architektur-Doku |
| **v1** | OAuth-Callback-Routes, Token-Persistenz in Supabase |
| **v2** | `getEmails()` / `sync()` für Gmail und Outlook |
| **v3** | Kalender + Kontakte, Webhook/Polling für Echtzeit-Intake |
| **v4** | Brain/Intake schrittweise von Mock auf Connect umstellen |

---

## Design- und Kompatibilitätsregeln

- Bestehende Seiten und Mock-Daten bleiben unverändert, bis Connect produktiv ist.
- Neue Integrationen werden unter `lib/integrations/` ergänzt — nicht in Komponenten.
- Jeder Provider implementiert dieselben Interface-Methoden; Unterschiede nur in `client.ts` / `service.ts`.
- Fehler und „noch nicht implementiert“ sind explizit (`IntegrationNotImplementedError`), nicht silent fails.
