# HELPY Voice Assistant — Discovery & Phasenplan

> Stand: Juli 2026 · Skills: Real Estate, Construction, Consulting-Legal

## Ziel

Anrufer erreichen das Unternehmen telefonisch. HELPY nimmt Anrufe entgegen, informiert transparent über KI-Nutzung, versteht das Anliegen (DE/CH), führt ein kurzes Gespräch und bereitet danach automatisch einen **Vorgang** (`quelle: "Telefon"`) plus **Kundenakte-Stub** vor.

Der Nutzer sieht nur das Ergebnis — nicht die Telefonie-Infrastruktur.

## Abgrenzung MVP

| In Scope (v1) | Nicht in v1 |
|---|---|
| Inbound PSTN (Twilio/Telnyx) | Outbound-Kampagnen |
| Begrüßung + KI-Hinweis (CH/EU) | Gesprächsaufzeichnung (Default: aus) |
| STT → Intent → Kurzantwort → TTS | Live-Übergabe an Mitarbeiter |
| Post-Call: Summary, Vorgang, Kundenakte | Kalender-Buchung (Phase 2) |
| Plattformen-Karte + Einstellungen | Mehrsprachigkeit EN/FR/IT |

## Architektur

```
Anrufer (PSTN)
    ↓
Twilio / Telnyx Webhook
    ↓
app/api/voice/webhook/twilio/*
    ↓
features/voice/services/
  ├── voice-greeting.ts        (Begrüßung + Disclosure)
  ├── voice-intent-engine.ts   (Intent-Klassifikation DE)
  ├── voice-summary-engine.ts  (Post-Call-Zusammenfassung)
  ├── voice-call-processor.ts  (Pipeline → Vorgang + Kundenakte)
  └── voice-vorgaenge-store.ts (Client-Cache, wie Outlook)
    ↓
Vorgänge · Kundenakte · Workspace
```

### Datenmodell

**`voice_settings`** (pro `company_id`):

- `enabled`, `provider`, `phone_number`
- `greeting_text`, `disclosure_text`
- `business_hours` (JSON, optional)

**`voice_calls`** (pro Anruf):

- `caller_phone`, `caller_name`, `status`, `duration_seconds`
- `transcript`, `summary`, `intent`, `vorgang_id`
- `external_call_id` (Twilio CallSid)

### Intent-Klassen (Phase 1)

| Intent | Vorgang-Typ | Beispiel |
|---|---|---|
| Besichtigung / Objektanfrage | `anfrage` | „Ich interessiere mich für die Wohnung …“ |
| Terminwunsch | `terminwunsch` | „Können wir morgen um 14 Uhr …“ |
| Rückruf | `rueckruf` | „Bitte rufen Sie mich zurück.“ |
| Angebotsanfrage | `angebotsanfrage` | „Was kostet eine Offerte …“ |
| Rechnung / Zahlung | `rechnung` | „Ich habe eine Frage zur Rechnung …“ |
| Sonstiges | `normale_nachricht` | Fallback |

## Provider-Empfehlung

| Komponente | Empfehlung | Begründung |
|---|---|---|
| PSTN | **Twilio** oder **Telnyx** | Webhooks, CH-Nummern, TwiML |
| STT | Google Cloud Speech / Azure | Gute DE-CH-Erkennung |
| TTS | Google / Azure Neural | Natürliche DE-Stimme |
| LLM | OpenAI / Anthropic (server-only) | Strukturierte Extraktion mit Safety-Layer |

Phase 1 nutzt **regelbasierte Intent-Erkennung** + Simulation — keine externen API-Keys nötig zum Testen.

## UI

### Plattformen (`/plattformen`)

Neue Karte **Telefonassistent** (wie Gmail/Outlook-Panels):

- Ein/Aus-Schalter
- Begrüßungstext bearbeiten
- KI-Hinweis (vorgegeben, CH-konform)
- **Testanruf simulieren** (Transkript eingeben → Vorgang erzeugen)
- Letzte Anrufe (Kurzliste)

### Vorgänge

Telefon-Vorgänge erscheinen in der bestehenden Liste mit `quelle: "Telefon"` und ☎-Emoji.

## Rechtliches (CH/EU — MVP)

1. **KI-Offenlegung** zu Gesprächsbeginn (fixer Text, nicht abschaltbar)
2. **Keine Aufzeichnung** im MVP (nur Transkript aus Live-STT im Arbeitsspeicher)
3. **Opt-out**: Anrufer kann jederzeit auflegen
4. **Datensparsamkeit**: Telefonnummer + Summary in DB; Transkript optional kürzen

## Phasen

### Phase 1 — Inbound + Vorgang (dieser Sprint)

- [x] Repo-Struktur + Discovery-Dokument
- [ ] DB-Migration `voice_settings`, `voice_calls`
- [ ] Intent-Engine + Post-Call-Pipeline
- [ ] API: Settings, Simulate, Twilio-Webhook (Stub)
- [ ] Plattformen-UI + Vorgänge-Integration
- [ ] Tests

**Testkriterium:** Simulierter Anruf erzeugt sichtbaren Vorgang + Kundenakte-Stub in der UI.

### Phase 2 — Kalender

- [x] Verfügbarkeit aus verbundenem Kalender
- [x] Terminvorschläge nach Telefon-Simulation
- [x] Bestätigung → Kalendereintrag (Plattformen + Workspace)

### Phase 3 — Live-STT/TTS (Twilio)

- [x] Twilio Webhooks: Incoming, Gather (Speech STT), Status
- [x] TTS-Antwort via TwiML `<Say language="de-CH">`
- [x] Geschäftszeiten-Logik (Mo–Fr 9–17, Europe/Zurich)
- [x] Signatur-Validierung (TWILIO_AUTH_TOKEN)
- [x] Client-Sync: eingehende Anrufe → Vorgänge in HELPY
- [x] Plattformen: Twilio-Webhook-URLs + Setup-Hinweise

**Testkriterium:** Echter Anruf auf Twilio-Nummer → gesprochene Antwort → Vorgang erscheint in HELPY.

### Phase 4 — Feinschliff

- Skill-spezifische Intents (Bau, Legal)
- CRM-Anreicherung
- Analytics-Dashboard

## Env-Variablen (Phase 3+)

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
VOICE_WEBHOOK_BASE_URL=https://your-app.example.com
```

## Dateistruktur

```
features/voice/
  types/voice-types.ts
  services/
    voice-greeting.ts
    voice-intent-engine.ts
    voice-summary-engine.ts
    voice-call-processor.ts
    voice-vorgaenge-store.ts
    voice-settings-client.ts
  components/
    voice-assistant-panel.tsx
lib/voice/
  require-voice-context.ts
  voice-call-repository.ts
  voice-settings-repository.ts
app/api/voice/
  settings/route.ts
  simulate/route.ts
  calls/route.ts
  webhook/twilio/incoming/route.ts
  webhook/twilio/status/route.ts
supabase/migrations/20260709200000_voice_assistant.sql
```
