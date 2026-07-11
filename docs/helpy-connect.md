# HELPY Connect

HELPY Connect ist die Integrationschicht zwischen externen Diensten (E-Mail, Kalender, Formulare, Kontakte) und der HELPY-Anwendungslogik. Sie macht HELPY skalierbar: neue Quellen werden als Provider ergänzt, ohne Brain, Intake oder UI umzubauen.

---

## Gmail ist die erste Test-Integration

Gmail dient als **Referenz-Implementierung** für den MailProvider. Die Struktur unter `lib/integrations/gmail/` zeigt, wie eine echte Anbindung später aussehen wird:

```
lib/integrations/gmail/
├── types.ts    # Gmail-interne Typen (API-Rohdaten)
├── client.ts   # HTTP-Kapselung (Gmail REST API)
└── service.ts  # MailProvider-Implementierung → NormalizedEmail
```

Outlook, Microsoft 365, IMAP und Formulare folgen dem **gleichen Muster** mit eigenem Client und Service — nicht mit Gmail-Code in fremden Modulen.

---

## Outlook und Microsoft 365 kommen später

Unter `lib/integrations/microsoft/` liegen bereits Stubs:

| Datei | Inhalt |
|-------|--------|
| `types.ts` | Graph-Typen, OAuth-Konfiguration, Scopes |
| `outlook.ts` | `OutlookMailService`, `Microsoft365MailService`, Kontakte |
| `calendar.ts` | `OutlookCalendarService`, `Microsoft365CalendarService` |

Alle Methoden werfen derzeit `IntegrationNotImplementedError` — bewusst, ohne Mock-Daten oder UI-Änderungen.

Geplant: **IMAP** als eigener Provider (`IntegrationProviderId: "imap"`), **Formulare** über `FormProvider.getSubmissions()`.

---

## UI spricht nie direkt mit Gmail

```
❌  components/dashboard → Gmail API
❌  helpy-brain → googleapis
✅  components/dashboard → helpyConnect → GmailService
✅  helpy-brain → NormalizedEmail[] (von Connect)
```

Komponenten importieren ausschließlich `@/lib/integrations`. Gmail-spezifische Logik bleibt in `lib/integrations/gmail/`. OAuth-Konfiguration in `lib/integrations/google/`.

---

## HELPY Brain bekommt Daten immer über HELPY Connect

```
Externe Quelle (Gmail, Outlook, Formular …)
        ↓
   Provider Service  (mappt auf Normalized*)
        ↓
   HelpyConnect      (connect · sync · Registry)
        ↓
   helpy-intake      (Erkennung neuer Eingänge)
        ↓
   helpy-brain       (Analyse, Priorisierung, Tagesplan)
        ↓
   UI                (Dashboard, Posteingang, Kalender)
```

Brain und Intake arbeiten heute mit Mock-Daten. Beim Umstieg auf Live-Daten ändert sich nur die **Datenquelle hinter Connect** — nicht die Brain-API.

---

## Provider-Interfaces

### MailProvider

```typescript
connect(options?)
disconnect(options?)
sync(options?)
getEmails(options?)
getEmailById(id)
```

### CalendarProvider

```typescript
connect(options?)
disconnect(options?)
sync(options?)
getEvents(options?)
createEvent(input)
```

### FormProvider

```typescript
getSubmissions(options?)
```

### ContactProvider

```typescript
getContacts(options?)
```

Alle Mail- und Kalender-Provider liefern **normalisierte Typen** (`NormalizedEmail`, `NormalizedCalendarEvent` usw.), definiert in `lib/integrations/types.ts`.

---

## Verzeichnisstruktur

```
lib/integrations/
├── types.ts          # Normalisierte Domain-Typen, Provider-IDs
├── provider.ts       # MailProvider, CalendarProvider, FormProvider, ContactProvider
├── connect.ts        # HelpyConnect — zentraler Orchestrator
├── index.ts
├── google/
│   ├── config.ts     # Umgebungsvariablen, Google-Konfiguration
│   └── oauth.ts      # OAuth-URL, Scopes
├── gmail/
│   ├── types.ts
│   ├── client.ts
│   └── service.ts
└── microsoft/
    ├── types.ts
    ├── outlook.ts
    └── calendar.ts
```

---

## HelpyConnect — Beispiel

```typescript
import { helpyConnect } from "@/lib/integrations";

helpyConnect.registerDefaults();

await helpyConnect.connectMail("gmail");
await helpyConnect.syncMail("gmail");

const gmail = helpyConnect.getMailProvider("gmail");
const emails = await gmail?.getEmails({ limit: 50 });
const detail = await gmail?.getEmailById("msg-123");
```

Connection-Status wird zentral in `IntegrationConnection` geführt — Grundlage für eine spätere Integrations-Einstellungsseite.

---

## Skalierbarkeit

| Prinzip | Wirkung |
|---------|---------|
| Provider-Interface pro Kategorie | Gmail, Outlook, IMAP implementieren dieselbe MailProvider-API |
| Normalisierte Typen | Brain kennt keine Gmail-Message-IDs |
| HelpyConnect als Facade | Eine Stelle für connect, sync, Registry |
| Provider-spezifischer Code isoliert | `gmail/`, `microsoft/`, später `imap/`, `forms/` |
| Stubs mit expliziten Fehlern | Keine halbfertigen API-Calls in Produktion |

---

## Nächste Schritte

1. OAuth-Callback-Routes (`/api/integrations/google/callback`)
2. Token-Persistenz in Supabase (pro User, verschlüsselt)
3. `GmailService.getEmails()` — erste echte API-Implementierung
4. Outlook/Microsoft 365 parallel nach dem Gmail-Muster
5. Intake/Brain schrittweise von Mock auf Connect umstellen

Ausführlichere Architekturübersicht: [`docs/architecture.md`](./architecture.md).
