# HELPY Voice Core v1

Providerunabhängige Telefonie-Plattform. Twilio, Teams, SIP usw. sind **austauschbare Provider** — die Gesprächslogik lebt ausschließlich im Voice Core.

## Module

```
features/voice/
  voice-core/       Call Lifecycle, ConversationSession
  voice-memory/     Transkript, Summary, Sentiment, nächste Schritte
  voice-router/     Skill-Routing (Real Estate, Construction, Consulting)
  voice-transcript/ STT/TTS-Abstraktion (Mock: Text)
  voice-ai/         Brain-Kontext + Antwort-Engine
  voice-calendar/   Termine (Wrapper um Appointment Engine)
  voice-provider/   VoiceProviderAdapter + MockProvider
  voice-settings/   Einstellungen
  voice-history/    ConversationSession Store
```

## Call Lifecycle

```
Incoming → Provider → Voice Core → STT → Brain → Memory → Decision → TTS → Provider
```

v1: **MockProvider** — kein echter Telefonanschluss.

## UI

Navigation: **Telefonie** (`/telefonie`)

Tabs: Mock Gespräch · Aktive · Vergangen · Voicemail · Transkripte · Memory · Provider · Einstellungen

## Provider wechseln

Nur `voice-provider/` anpassen. Voice Core bleibt unverändert.

Twilio-Webhooks sind in v1 deaktiviert (503). Stub: `twilio-provider.stub.ts`.

## Mock testen

1. `/telefonie` → **Mock Gespräch**
2. Text eingeben → Mock-Gespräch starten
3. Memory, Transkripte, Vorgang prüfen
