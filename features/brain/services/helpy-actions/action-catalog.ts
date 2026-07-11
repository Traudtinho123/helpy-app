import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { HelpyAction, HelpyActionScenario } from "@/features/brain/services/helpy-actions/types";

type ScenarioConfig = {
  label: string;
  actions: Omit<HelpyAction, "priority">[];
};

const REAL_ESTATE_SCENARIOS: Record<HelpyActionScenario, ScenarioConfig> = {
  besichtigung: {
    label: "Neue Besichtigung",
    actions: [
      {
        id: "re-besichtigung-planen",
        icon: "📅",
        title: "Besichtigung planen",
        description: "Termin mit Interessent und Objektverfügbarkeit abstimmen.",
        benefit: "Spart ~15 Min. Koordination",
        primaryLabel: "Termin vorschlagen",
      },
      {
        id: "re-expose-senden",
        icon: "📧",
        title: "Exposé senden",
        description: "Passendes Exposé mit Lage, Fläche und Preis versenden.",
        benefit: "Erhöht Anfrage-Qualität",
        primaryLabel: "Exposé versenden",
      },
      {
        id: "re-interessent-anlegen",
        icon: "👤",
        title: "Interessent anlegen",
        description: "Kontaktdaten, Budget und Präferenzen in der Akte erfassen.",
        benefit: "Bessere Nachverfolgung",
        primaryLabel: "Akte anlegen",
      },
      {
        id: "re-rueckruf-planen",
        icon: "☎",
        title: "Rückruf planen",
        description: "Persönlicher Follow-up-Anruf nach dem Erstkontakt.",
        benefit: "Höhere Abschlussquote",
        primaryLabel: "Rückruf einplanen",
      },
    ],
  },
  interessent: {
    label: "Neuer Interessent",
    actions: [
      {
        id: "re-willkommen",
        icon: "📧",
        title: "Willkommensmail senden",
        description: "Persönliche Antwort mit nächsten Schritten und Objektvorschlägen.",
        benefit: "Schnelle Erstreaktion",
        primaryLabel: "Mail vorbereiten",
      },
      {
        id: "re-erstgespraech",
        icon: "📅",
        title: "Erstgespräch planen",
        description: "Kurzes Kennenlerngespräch zur Bedarfsklärung.",
        benefit: "Qualifiziert den Lead",
        primaryLabel: "Termin vorschlagen",
      },
      {
        id: "re-interessent-anlegen-2",
        icon: "👤",
        title: "Interessent anlegen",
        description: "Lead mit Quelle, Budget und Suchprofil dokumentieren.",
        benefit: "Kein Kontakt geht verloren",
        primaryLabel: "Akte anlegen",
      },
      {
        id: "re-objekt-matching",
        icon: "🏡",
        title: "Objekte vorschlagen",
        description: "Passende Immobilien aus dem Bestand auswählen.",
        benefit: "Zeigt sofort Mehrwert",
        primaryLabel: "Matching starten",
      },
    ],
  },
  offertanfrage: { label: "Anfrage", actions: [] },
  rueckfrage: { label: "Rückfrage", actions: [] },
  "neue-anfrage": { label: "Anfrage", actions: [] },
  frist: { label: "Frist", actions: [] },
  termin: { label: "Termin", actions: [] },
  angebot: { label: "Angebot", actions: [] },
  allgemein: {
    label: "Immobilienvorgang",
    actions: [
      {
        id: "re-default-besichtigung",
        icon: "📅",
        title: "Besichtigung planen",
        description: "Nächsten sinnvollen Besichtigungstermin koordinieren.",
        benefit: "Beschleunigt den Verkauf",
        primaryLabel: "Termin planen",
      },
      {
        id: "re-default-expose",
        icon: "📧",
        title: "Exposé senden",
        description: "Aktuelles Exposé personalisiert versenden.",
        benefit: "Stärkt Vertrauen",
        primaryLabel: "Exposé senden",
      },
      {
        id: "re-default-interessent",
        icon: "👤",
        title: "Interessent aktualisieren",
        description: "Status, Notizen und nächste Schritte pflegen.",
        benefit: "Klare Pipeline",
        primaryLabel: "Akte öffnen",
      },
      {
        id: "re-default-rueckruf",
        icon: "☎",
        title: "Rückruf planen",
        description: "Follow-up für offene Rückfragen einplanen.",
        benefit: "Hält Momentum",
        primaryLabel: "Rückruf planen",
      },
    ],
  },
};

const CONSTRUCTION_SCENARIOS: Record<HelpyActionScenario, ScenarioConfig> = {
  offertanfrage: {
    label: "Neue Offertanfrage",
    actions: [
      {
        id: "hw-offerte-erstellen",
        icon: "📄",
        title: "Offerte erstellen",
        description: "Positionen, Material und Aufwand aus der Anfrage ableiten.",
        benefit: "Spart ~25 Min. Erstellung",
        primaryLabel: "Offerte starten",
      },
      {
        id: "hw-baustellenbesichtigung",
        icon: "📅",
        title: "Baustellenbesichtigung planen",
        description: "Vor-Ort-Termin für Aufmaß und Machbarkeit abstimmen.",
        benefit: "Präzisere Kalkulation",
        primaryLabel: "Besichtigung planen",
      },
      {
        id: "hw-material-pruefen",
        icon: "📦",
        title: "Material prüfen",
        description: "Verfügbarkeit und Lieferzeiten der benötigten Materialien checken.",
        benefit: "Vermeidet Verzögerungen",
        primaryLabel: "Material checken",
      },
      {
        id: "hw-kunde-anrufen",
        icon: "☎",
        title: "Kunde anrufen",
        description: "Kurze Klärung offener Punkte vor der Offertierung.",
        benefit: "Weniger Nachfragen",
        primaryLabel: "Anruf vorbereiten",
      },
    ],
  },
  rueckfrage: {
    label: "Kundenrückfrage",
    actions: [
      {
        id: "hw-antwort-vorbereiten",
        icon: "📧",
        title: "Antwort vorbereiten",
        description: "Präzise Antwort zu Garantie, Wartung und Konditionen.",
        benefit: "Beschleunigt Abschluss",
        primaryLabel: "Antwort schreiben",
      },
      {
        id: "hw-angebot-nachreichen",
        icon: "📄",
        title: "Angebot aktualisieren",
        description: "Offerte mit den geklärten Punkten ergänzen.",
        benefit: "Reduziert Reibung",
        primaryLabel: "Angebot öffnen",
      },
      {
        id: "hw-rueckruf-kunde",
        icon: "☎",
        title: "Kunde anrufen",
        description: "Persönliche Klärung für komplexe Rückfragen.",
        benefit: "Stärkt Beziehung",
        primaryLabel: "Anruf planen",
      },
      {
        id: "hw-material-pruefen-2",
        icon: "📦",
        title: "Material prüfen",
        description: "Technische Details und Alternativen verifizieren.",
        benefit: "Sichere Aussagen",
        primaryLabel: "Details prüfen",
      },
    ],
  },
  besichtigung: { label: "Besichtigung", actions: [] },
  interessent: { label: "Interessent", actions: [] },
  "neue-anfrage": { label: "Anfrage", actions: [] },
  frist: { label: "Frist", actions: [] },
  termin: { label: "Termin", actions: [] },
  angebot: {
    label: "Angebot versenden",
    actions: [
      {
        id: "hw-angebot-finalisieren",
        icon: "📄",
        title: "Offerte finalisieren",
        description: "Letzte Positionen prüfen und versandfertig machen.",
        benefit: "Schneller Versand",
        primaryLabel: "Offerte prüfen",
      },
      {
        id: "hw-lieferung-klaeren",
        icon: "📦",
        title: "Lieferung klären",
        description: "Termine und Logistik mit dem Kunden abstimmen.",
        benefit: "Realistische Zusage",
        primaryLabel: "Logistik checken",
      },
      {
        id: "hw-termin-nachfassen",
        icon: "📅",
        title: "Termin nachfassen",
        description: "Besprechung oder Follow-up einplanen.",
        benefit: "Hält Projekt warm",
        primaryLabel: "Termin setzen",
      },
      {
        id: "hw-kunde-anrufen-2",
        icon: "☎",
        title: "Kunde anrufen",
        description: "Kurzes Update vor dem Versand des Angebots.",
        benefit: "Persönlicher Touch",
        primaryLabel: "Anruf vorbereiten",
      },
    ],
  },
  allgemein: {
    label: "Baustellenvorgang",
    actions: [
      {
        id: "hw-default-offerte",
        icon: "📄",
        title: "Offerte erstellen",
        description: "Angebot aus Vorgangsdaten strukturiert aufbauen.",
        benefit: "Spart Zeit",
        primaryLabel: "Offerte starten",
      },
      {
        id: "hw-default-besichtigung",
        icon: "📅",
        title: "Baustellenbesichtigung planen",
        description: "Vor-Ort-Termin mit Kunde koordinieren.",
        benefit: "Bessere Planung",
        primaryLabel: "Termin planen",
      },
      {
        id: "hw-default-material",
        icon: "📦",
        title: "Material prüfen",
        description: "Bedarf und Verfügbarkeit gegenprüfen.",
        benefit: "Weniger Risiko",
        primaryLabel: "Material checken",
      },
      {
        id: "hw-default-anruf",
        icon: "☎",
        title: "Kunde anrufen",
        description: "Direkter Kontakt für schnelle Klärung.",
        benefit: "Klare Kommunikation",
        primaryLabel: "Anruf vorbereiten",
      },
    ],
  },
};

const CONSULTING_SCENARIOS: Record<HelpyActionScenario, ScenarioConfig> = {
  "neue-anfrage": {
    label: "Neue Anfrage",
    actions: [
      {
        id: "cl-angebot-erstellen",
        icon: "📄",
        title: "Angebot erstellen",
        description: "Leistungsumfang und Honorar aus der Anfrage ableiten.",
        benefit: "Spart ~20 Min. Vorbereitung",
        primaryLabel: "Angebot starten",
      },
      {
        id: "cl-erstgespraech",
        icon: "📅",
        title: "Erstgespräch planen",
        description: "Kennenlerngespräch zur Mandatsklärung vorschlagen.",
        benefit: "Qualifiziert den Lead",
        primaryLabel: "Termin vorschlagen",
      },
      {
        id: "cl-mandant-anlegen",
        icon: "📁",
        title: "Mandant anlegen",
        description: "Stammdaten, Ansprechpartner und Mandatsart erfassen.",
        benefit: "Saubere Akte von Tag 1",
        primaryLabel: "Mandant anlegen",
      },
      {
        id: "cl-antwort-vorbereiten",
        icon: "📧",
        title: "Antwort vorbereiten",
        description: "Professionelle Erstantwort mit nächsten Schritten.",
        benefit: "Schnelle Reaktion",
        primaryLabel: "Antwort schreiben",
      },
    ],
  },
  frist: {
    label: "Frist beachten",
    actions: [
      {
        id: "cl-frist-sichern",
        icon: "📅",
        title: "Frist im Kalender sichern",
        description: "Einspruchsfrist oder Deadline mit Erinnerung eintragen.",
        benefit: "Vermeidet Fristversäumnis",
        primaryLabel: "Frist eintragen",
      },
      {
        id: "cl-dokument-pruefen",
        icon: "📁",
        title: "Dokument prüfen",
        description: "Bescheid oder Schriftstück sorgfältig sichten.",
        benefit: "Fundierte Entscheidung",
        primaryLabel: "Dokument öffnen",
      },
      {
        id: "cl-mandant-informieren",
        icon: "📧",
        title: "Mandant informieren",
        description: "Kurzes Update mit Handlungsempfehlung senden.",
        benefit: "Proaktiver Service",
        primaryLabel: "Update senden",
      },
      {
        id: "cl-berater-kontakt",
        icon: "☎",
        title: "Steuerberater kontaktieren",
        description: "Fachliche Rücksprache bei komplexen Fällen.",
        benefit: "Sichere Beratung",
        primaryLabel: "Kontakt vorbereiten",
      },
    ],
  },
  termin: {
    label: "Termin vorbereiten",
    actions: [
      {
        id: "cl-gespraech-vorbereiten",
        icon: "📅",
        title: "Gespräch vorbereiten",
        description: "Agenda, Unterlagen und offene Punkte zusammenstellen.",
        benefit: "Effizientes Meeting",
        primaryLabel: "Vorbereitung starten",
      },
      {
        id: "cl-angebot-bereit",
        icon: "📄",
        title: "Angebot bereithalten",
        description: "Entwurf für das Gespräch parat haben.",
        benefit: "Bereit für Abschluss",
        primaryLabel: "Angebot öffnen",
      },
      {
        id: "cl-dokumente-sammeln",
        icon: "📁",
        title: "Dokumente sammeln",
        description: "Relevante Verträge und Notizen für den Termin.",
        benefit: "Keine Lücken",
        primaryLabel: "Unterlagen öffnen",
      },
      {
        id: "cl-einladung-senden",
        icon: "📧",
        title: "Kalendereinladung senden",
        description: "Terminbestätigung mit Link und Agenda.",
        benefit: "Klare Erwartung",
        primaryLabel: "Einladung senden",
      },
    ],
  },
  angebot: {
    label: "Angebot fertigstellen",
    actions: [
      {
        id: "cl-angebot-freigeben",
        icon: "📄",
        title: "Angebot freigeben",
        description: "Entwurf final prüfen und zur Freigabe einreichen.",
        benefit: "Schneller Versand",
        primaryLabel: "Freigabe starten",
      },
      {
        id: "cl-mandant-kontakt",
        icon: "☎",
        title: "Mandant kontaktieren",
        description: "Kurzes Update zum Angebotsstand.",
        benefit: "Erwartungsmanagement",
        primaryLabel: "Kontakt vorbereiten",
      },
      {
        id: "cl-dokument-pruefen-2",
        icon: "📁",
        title: "Vertrag prüfen",
        description: "Leistungsumfang und Konditionen gegenprüfen.",
        benefit: "Weniger Korrekturen",
        primaryLabel: "Vertrag öffnen",
      },
      {
        id: "cl-follow-up",
        icon: "📧",
        title: "Follow-up planen",
        description: "Erinnerung für Rückmeldung nach Versand setzen.",
        benefit: "Kein Angebot vergessen",
        primaryLabel: "Follow-up setzen",
      },
    ],
  },
  besichtigung: { label: "Besichtigung", actions: [] },
  interessent: { label: "Interessent", actions: [] },
  offertanfrage: { label: "Offerte", actions: [] },
  rueckfrage: { label: "Rückfrage", actions: [] },
  allgemein: {
    label: "Beratungsvorgang",
    actions: [
      {
        id: "cl-default-angebot",
        icon: "📄",
        title: "Angebot erstellen",
        description: "Honorarvorschlag aus Vorgangsdaten ableiten.",
        benefit: "Strukturierter Ablauf",
        primaryLabel: "Angebot starten",
      },
      {
        id: "cl-default-termin",
        icon: "📅",
        title: "Erstgespräch planen",
        description: "Termin zur Bedarfsklärung vorschlagen.",
        benefit: "Qualifiziert Anfrage",
        primaryLabel: "Termin vorschlagen",
      },
      {
        id: "cl-default-mandant",
        icon: "📁",
        title: "Mandant anlegen",
        description: "Akte mit Stammdaten und Mandatsart anlegen.",
        benefit: "Saubere Basis",
        primaryLabel: "Mandant anlegen",
      },
      {
        id: "cl-default-antwort",
        icon: "📧",
        title: "Antwort vorbereiten",
        description: "Nächste Schritte klar kommunizieren.",
        benefit: "Professioneller Eindruck",
        primaryLabel: "Antwort schreiben",
      },
    ],
  },
};

export const SKILL_SCENARIO_CATALOG: Record<
  HelpySkill,
  Record<HelpyActionScenario, ScenarioConfig>
> = {
  "real-estate": REAL_ESTATE_SCENARIOS,
  construction: CONSTRUCTION_SCENARIOS,
  "consulting-legal": CONSULTING_SCENARIOS,
};

export function getScenarioActions(
  skill: HelpySkill,
  scenario: HelpyActionScenario
): ScenarioConfig {
  const catalog = SKILL_SCENARIO_CATALOG[skill];
  const config = catalog[scenario];

  if (config.actions.length > 0) {
    return config;
  }

  return catalog.allgemein;
}
