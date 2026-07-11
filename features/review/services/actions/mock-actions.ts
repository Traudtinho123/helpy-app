import type { ActionDefinition } from "@/features/review/services/actions/types";

export const ACTION_CATALOG: ActionDefinition[] = [
  {
    id: "interessent-anlegen",
    title: "Interessent anlegen",
    description: "Kontaktdaten und Interesse für diesen Vorgang erfassen.",
    skill: "real-estate",
    icon: "👤",
    defaultPriority: "hoch",
    resultAfterExecution:
      "Interessent wurde vorbereitet — bitte Daten final prüfen.",
  },
  {
    id: "besichtigung-planen",
    title: "Besichtigung planen",
    description: "Terminvorschlag und Objektbezug für die Besichtigung vorbereiten.",
    skill: "real-estate",
    icon: "🔑",
    defaultPriority: "hoch",
    resultAfterExecution:
      "Besichtigungstermin wurde vorbereitet — bitte final bestätigen.",
  },
  {
    id: "expose-vorbereiten",
    title: "Exposé vorbereiten",
    description:
      "Objektdaten und Eckpunkte für ein professionelles Exposé zusammenstellen.",
    skill: "real-estate",
    icon: "📋",
    defaultPriority: "mittel",
    resultAfterExecution:
      "Exposé-Entwurf wurde vorbereitet — bitte Inhalt prüfen.",
  },
  {
    id: "antwort-vorbereiten",
    title: "Antwort vorbereiten",
    description:
      "Eine passende Antwort mit allen wichtigen Informationen formulieren.",
    skill: "real-estate",
    icon: "✉",
    defaultPriority: "mittel",
    resultAfterExecution:
      "Antwortentwurf liegt bereit — bitte vor dem Versand prüfen.",
  },
  {
    id: "rueckruf-planen",
    title: "Rückruf planen",
    description: "Rückruf in den Kalender legen und Gesprächspunkte vormerken.",
    skill: "real-estate",
    icon: "📞",
    defaultPriority: "hoch",
    resultAfterExecution:
      "Rückruf wurde eingeplant — bitte Zeitfenster bestätigen.",
  },
  {
    id: "kunde-anlegen",
    title: "Kunde anlegen",
    description: "Neue Kundendaten für diesen Auftrag strukturiert erfassen.",
    skill: "construction",
    icon: "👤",
    defaultPriority: "hoch",
    resultAfterExecution: "Kundenakte wurde vorbereitet — bitte Angaben prüfen.",
  },
  {
    id: "baustellenbesichtigung-planen",
    title: "Baustellenbesichtigung planen",
    description: "Vor-Ort-Termin vorbereiten und benötigte Infos zusammenstellen.",
    skill: "construction",
    icon: "🏗",
    defaultPriority: "hoch",
    resultAfterExecution:
      "Baustellenbesichtigung wurde vorbereitet — bitte Termin bestätigen.",
  },
  {
    id: "offerte-vorbereiten",
    title: "Offerte vorbereiten",
    description: "Positionen, Material und Kalkulation für die Offerte vorbereiten.",
    skill: "construction",
    icon: "🔨",
    defaultPriority: "hoch",
    resultAfterExecution:
      "Offertenentwurf wurde vorbereitet — bitte Preise prüfen.",
  },
  {
    id: "materialliste-vorbereiten",
    title: "Materialliste vorbereiten",
    description: "Materialbedarf für diesen Auftrag strukturiert auflisten.",
    skill: "construction",
    icon: "📦",
    defaultPriority: "mittel",
    resultAfterExecution:
      "Materialliste wurde vorbereitet — bitte Mengen vor Ort verifizieren.",
  },
  {
    id: "mandant-anlegen",
    title: "Mandant/Kunde anlegen",
    description: "Mandantendaten und Erstkontakt für die Akte vorbereiten.",
    skill: "consulting-legal",
    icon: "⚖",
    defaultPriority: "hoch",
    resultAfterExecution:
      "Mandantenakte wurde vorbereitet — bitte Angaben prüfen.",
  },
  {
    id: "erstgespraech-planen",
    title: "Erstgespräch planen",
    description: "Termin und Gesprächsagenda für das Erstgespräch vorbereiten.",
    skill: "consulting-legal",
    icon: "📅",
    defaultPriority: "hoch",
    resultAfterExecution:
      "Erstgespräch wurde vorbereitet — bitte Termin bestätigen.",
  },
  {
    id: "frist-sichern",
    title: "Frist sichern",
    description: "Frist im Kalender markieren und nächste Schritte vormerken.",
    skill: "consulting-legal",
    icon: "⏰",
    defaultPriority: "kritisch",
    resultAfterExecution:
      "Frist wurde im Kalender vorbereitet — bitte Verantwortliche prüfen.",
  },
  {
    id: "dokument-pruefen",
    title: "Dokument prüfen",
    description: "Relevante Unterlagen zum Vorgang öffnen und prüfen.",
    skill: "consulting-legal",
    icon: "📎",
    defaultPriority: "mittel",
    resultAfterExecution:
      "Dokumentenprüfung wurde vorbereitet — bitte Inhalt final bestätigen.",
  },
  {
    id: "angebot-vorbereiten",
    title: "Angebot vorbereiten",
    description:
      "Leistungsbeschreibung und Konditionen für das Angebot zusammenstellen.",
    skill: "consulting-legal",
    icon: "📄",
    defaultPriority: "hoch",
    resultAfterExecution:
      "Angebotsentwurf wurde vorbereitet — bitte Konditionen prüfen.",
  },
];
