# HELPY v0.1 — Roadmap

Ziel: Von der Demo-App zur echten SaaS-Basis — jeder Nutzer sieht nur seine eigenen Daten, gespeichert in Supabase.

---

## Phase 1 — Fundament

### Infrastruktur & Auth
- [x] Supabase-Projekt anlegen
- [x] `.env.local` mit `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] E-Mail + Passwort Login / Registrierung
- [x] Session-Erkennung & Route-Schutz (Middleware)
- [x] Logout
- [ ] Google OAuth aktivieren (Button vorbereitet, Provider noch offen)

### Datenbank
- [x] SQL-Schema definiert (`docs/database-schema.sql`)
- [ ] Migration in Supabase ausführen (SQL Editor oder CLI)
- [ ] Profil-Trigger testen (Registrierung → Eintrag in `profiles`)
- [ ] RLS manuell verifizieren (zweiter Testnutzer, kein Zugriff auf fremde Daten)
- [ ] TypeScript-Typen an v0.1-Schema anpassen (`lib/database/types.ts`)

---

## Phase 2 — Profil & Mandant

- [ ] Profil beim ersten Login laden (`profiles`)
- [ ] Anzeigename im Dashboard aus `vorname` / `nachname` (statt „Martina“)
- [ ] Avatar-Initial aus Profil statt Platzhalter „M“
- [ ] Einstellungsseite: Firma, Telefon, Sprache, Logo-URL bearbeiten
- [ ] Onboarding-Flow nach Registrierung (Profil vervollständigen)

---

## Phase 3 — Kunden (CRM)

- [ ] Supabase-Queries für `kunden` (CRUD)
- [ ] Kundenliste: Mock-Daten durch echte DB-Daten ersetzen
- [ ] Kunde anlegen / bearbeiten / löschen
- [ ] Kundenprofil & Timeline aus verknüpften `emails`, `angebote`, `termine`
- [ ] Suche & Filter serverseitig

**UI bleibt unverändert** — nur Datenquelle wechselt von `mockCustomers` zu Supabase.

---

## Phase 4 — Posteingang

- [ ] Supabase-Queries für `emails`
- [ ] E-Mail-Liste aus DB laden
- [ ] Status-Workflow: `neu` → `gelesen` → `beantwortet` → `archiviert`
- [ ] `zusammenfassung` und `antwort_entwurf` speichern (später KI-Anbindung)
- [ ] Verknüpfung mit `kunde_id`
- [ ] Tasks aus E-Mails in `tasks` anlegen

**UI bleibt unverändert** — Mock in `lib/inbox/mock-emails.ts` schrittweise ablösen.

---

## Phase 5 — Angebote

- [ ] Supabase-Queries für `angebote` + `angebotspositionen`
- [ ] Angebotsübersicht aus DB
- [ ] Angebot erstellen mit Positionen (Netto/Brutto berechnen)
- [ ] Status-Workflow: `entwurf` → `gesendet` → `angenommen` / `abgelehnt`
- [ ] PDF-Upload → `pdf_url` (Supabase Storage, Bucket + Policy)

---

## Phase 6 — Kalender & Tasks

- [ ] Supabase-Queries für `termine`
- [ ] Monats-/Tagesansicht aus DB
- [ ] Termin anlegen / bearbeiten / löschen
- [ ] Verknüpfung Termin ↔ Kunde ↔ E-Mail
- [ ] Dashboard Work-Queue aus offenen `tasks` (`erledigt = false`)

---

## Phase 7 — Dashboard (Heute)

- [ ] KPI-Karten aus echten Zählwerten (neue E-Mails, offene Angebote, Termine heute)
- [ ] Begrüßung mit Profilnamen
- [ ] Work-Queue aus `tasks` + dringende `emails`
- [ ] HELPY-Panel: erste echte Insights aus DB-Aggregationen

---

## Phase 8 — Qualität & Go-Live v0.1

- [ ] Fehlerbehandlung & Loading-States für alle DB-Operationen
- [ ] Leere Zustände (kein Kunde, leerer Posteingang)
- [ ] E2E-Test: Registrieren → Kunde anlegen → Angebot → Termin → Logout
- [ ] Supabase Storage für Logos & PDFs
- [ ] Produktions-Env-Variablen setzen
- [ ] Backup-Strategie dokumentieren

---

## Migrations-Anleitung

```bash
# Option A: Supabase Dashboard
# SQL Editor → docs/database-schema.sql einfügen → Run

# Option B: Supabase CLI
supabase db execute --file docs/database-schema.sql
```

**Hinweis:** Falls bereits `supabase/migrations/20260706150000_helpy_office_schema.sql` angewendet wurde (älteres Schema mit `erstellt_am` / Enums), Projekt zurücksetzen oder Schema manuell migrieren, bevor v0.1 angewendet wird.

---

## Architektur-Prinzipien v0.1

| Prinzip | Umsetzung |
|---------|-----------|
| Mandantentrennung | `user_id` + RLS auf allen Tabellen |
| UI stabil halten | Mock-Layer durch Repository-Funktionen ersetzen, nicht Komponenten umschreiben |
| Schrittweise Migration | Modul für Modul (Kunden → E-Mails → Angebote → Termine) |
| Keine Demo-Daten in DB | Seed nur für lokale Entwicklung, optional separater Seed-Script |
| Typen synchron halten | Nach Schema-Änderung `lib/database/types.ts` aktualisieren |

---

## Dateien-Referenz

```
docs/
  database-schema.sql    ← v0.1 SQL-Migration (Source of Truth)
  helpy-v01-roadmap.md   ← diese Checkliste
  supabase-setup.md      ← Auth & Env-Setup

lib/
  database/types.ts      ← TypeScript-Typen (nach Migration anpassen)
  supabase/client.ts     ← Browser-Client
  supabase/server.ts     ← Server-Client
  auth/                  ← Auth-Logik (fertig)

lib/*/mock-*.ts          ← Demo-Daten (schrittweise ablösen, nicht löschen bis Phase abgeschlossen)
```

---

## Definition of Done — v0.1

HELPY v0.1 ist fertig, wenn:

1. Ein Nutzer sich registrieren und anmelden kann
2. Sein Profil automatisch angelegt wird
3. Er Kunden, E-Mails, Angebote und Termine anlegen und nur seine eigenen sieht
4. Das Dashboard echte KPIs aus der Datenbank zeigt
5. Die bestehende UI optisch unverändert bleibt
