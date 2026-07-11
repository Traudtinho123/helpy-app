# HELPY Feature-Struktur

Architecture Sprint v1 — Vorbereitung für echte Integrationen ohne UI- oder Verhaltensänderungen.

## Warum `features/`?

Bisher lagen Feature-Logik und UI verteilt in `components/<feature>/` und `lib/<feature>/`. Das skaliert schlecht, sobald Gmail, Kalender, ImmoScout24 & Co. echte APIs bekommen.

`features/` gruppiert **alles zu einem fachlichen Bereich** an einem Ort:

```
features/<name>/
  components/   → React UI (Seiten, Panels, Listen)
  hooks/        → Client-Hooks (optional)
  services/     → Engines, Stores, Integration-Clients
  types/        → Domain-Typen (optional, oft in services/)
  utils/        → Feature-spezifische Helfer
  mock/         → Mock-Daten für Demo/Entwicklung
```

**Vorteile:**

- Klare Grenzen zwischen Features
- Integrationen landen direkt im richtigen Feature (`features/gmail/services/`)
- `app/` bleibt dünn — nur Routing und Page-Wrapper
- Parallele Entwicklung ohne Cross-Feature-Chaos

## Was bleibt in `components/`?

| Pfad | Zweck |
|---|---|
| `components/ui/` | **Design System** — Button, Card, Panel, Modal, … |
| `components/dashboard/` | App-Shell — Sidebar, Header, KPI, Work-Queue |
| `components/auth/` | Login, Registrierung |
| `components/helpy/` | Geteiltes HELPY-Branding (Avatar, Logo, ActionCards) |
| `components/user-menu/` | Avatar-Dropdown, Skill-Switcher |
| `components/company/` | Firmen-Branding (Dokumente, Angebote, Settings) |
| `components/settings/` | Einstellungen-Shell |
| `components/analytics/` | Analytics-Platzhalter |
| `components/providers/` | App-weite Provider |

Keine Feature-Business-Logik in diesen Ordnern.

## Was bleibt in `lib/`?

Querschnittliche Infrastruktur — **feature-agnostisch**:

| Pfad | Zweck |
|---|---|
| `lib/auth/` | Authentifizierung, Routen, Session |
| `lib/supabase/` | Supabase-Clients |
| `lib/design/` | Design Tokens |
| `lib/ui/` | Deprecated Aliase → `lib/design` |
| `lib/hooks/` | Shared Hooks (`useExternalStore`) |
| `lib/utils.ts` | `cn()` und allgemeine Utilities |
| `lib/company/` | Firmenprofil (shared) |
| `lib/database/` | DB-Typen |

Alles Fachliche liegt unter `features/`.

## Feature-Übersicht

| Feature | Pfad | Inhalt |
|---|---|---|
| **gmail** | `features/gmail/` | Posteingang, E-Mail-Analyse, Gmail/Google/Microsoft-Outlook-Services |
| **calendar** | `features/calendar/` | Kalender-UI, Events-Store, Microsoft Calendar |
| **immoscout24** | `features/immoscout24/` | Anfragen-UI, Parser, Connector |
| **workspace** | `features/workspace/` | Vorgänge, Workspace-Shell, Status, Decision Engine |
| **workflow** | `features/workflow/` | Arbeitsablauf-Automation, Workflow-Engine, Helpy-Work |
| **customers** | `features/customers/` | Kunden-CRM, Timeline |
| **offers** | `features/offers/` | Angebote, PDF-Vorschau |
| **documents** | `features/documents/` | Dokumenten-Engine, Vorlagen |
| **memory** | `features/memory/` | HELPY-Gedächtnis, Kunden-Memory |
| **brain** | `features/brain/` | Brain v2, Intake, Autopilot, Workday |
| **review** | `features/review/` | Prüfen & Bestätigen, Safety-Copy, Actions |
| **platforms** | `features/platforms/` | Plattform-Registry, Connect-Pipeline |
| **tasks** | `features/tasks/` | Aufgaben-Seite (Platzhalter) |
| **events** | `features/events/` | Event Bus — zentraler Eingang für Plattform-Events |

## Event Bus (v1)

```
Plattform → Event Bus → Normalizer → HelpyEvent → Event Router → Brain
```

Brain arbeitet nur mit `HelpyEvent`. Import: `@/features/events`

## Import-Konvention

```tsx
// Feature-Komponente
import { InboxPage } from "@/features/gmail/components/inbox-page";

// Feature-Service
import { getWorkspaceVorgang } from "@/features/workspace/services/workspace/workspace-engine";

// Design System
import { Button, Panel } from "@/components/ui";

// Shared Infra
import { cn } from "@/lib/utils";
import { tokens } from "@/lib/design";
```

Import-Pfade folgen dem Muster `@/features/<feature>/<layer>/...`.

## Wie neue Integrationen eingebaut werden

### 1. Feature identifizieren

Gmail → `features/gmail/`, Kalender → `features/calendar/`, etc.

### 2. Service-Schicht anlegen

```
features/gmail/services/
  gmail/
    client.ts      ← API-Client
    service.ts     ← Business-Logik
    types.ts
  google/
    oauth.ts
```

### 3. Mock → Live tauschen

Mocks bleiben in `mock/` bis die Integration stabil ist. Services exportieren dieselbe Interface — UI ändert sich nicht.

### 4. Plattform-Registry (optional)

Neue Provider in `features/platforms/services/platform/registry.ts` registrieren. Connect-Events über `features/platforms/services/connect/`.

### 5. `app/` — nur Routing

```tsx
// app/posteingang/page.tsx
import { InboxPage } from "@/features/gmail/components/inbox-page";

export default function PosteingangPage() {
  return <InboxPage />;
}
```

### 6. Kein Feature importiert UI aus einem anderen Feature

Cross-Feature nur über **Services/Types**, z. B.:

- `features/gmail` → `features/calendar/services/calendar-events-store` (Termin aus E-Mail)
- `features/workspace` → `features/brain/services/brain-v2` (Vorgangs-Intelligenz)

## Migration (Sprint v1)

Verschoben von `components/*` und `lib/*` nach `features/*`. Alte Pfade existieren nicht mehr — alle Imports zeigen auf `@/features/...`.

Hilfsskripte (nur für Migration):

- `scripts/migrate-features.mjs` — Dateiverschiebung
- `scripts/rewrite-feature-imports.mjs` — Import-Rewrite

## Nächste Schritte (optional, kein Sprint-v1-Scope)

- Feature-Barrel-Exports (`features/gmail/index.ts`)
- `hooks/`-Ordner pro Feature bei wachsendem Client-State
- ESLint-Regel: kein Import aus fremden Feature-`components/`
