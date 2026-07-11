import type {
  IntakeEvent,
  IntakeSummary,
  IntakeTimelineEntry,
  IntakeVorgang,
} from "@/features/brain/services/intake/types";

export const MOCK_INTAKE_DETECTIONS: IntakeEvent[] = [
  {
    id: "det-email",
    type: "email",
    label: "Neue E-Mail erkannt",
    source: "Thomas Müller · Weber & Co. GmbH",
    detectedAt: "09:14",
  },
  {
    id: "det-formular",
    type: "formular",
    label: "Neue Formularanfrage erkannt",
    source: "Kontaktformular · Website",
    detectedAt: "09:14",
  },
  {
    id: "det-termin",
    type: "termin",
    label: "Terminwunsch erkannt",
    source: "Sandra Klein · Schmidt GmbH",
    detectedAt: "09:15",
  },
  {
    id: "det-angebot",
    type: "angebot",
    label: "Angebotsanfrage erkannt",
    source: "Anna Hoffmann · Schmidt GmbH",
    detectedAt: "09:15",
  },
  {
    id: "det-rechnung",
    type: "rechnung",
    label: "Rechnung erkannt",
    source: "Müller Logistik AG",
    detectedAt: "09:16",
  },
];

export const MOCK_INTAKE_VORGAENGE: IntakeVorgang[] = [
  {
    id: "vorg-steuerbescheid",
    typ: "aufgabe",
    absender: "Finanzamt München",
    kunde: "Finanzamt München",
    zusammenfassung:
      "Steuerbescheid prüfen und Unterlagen bis 15.04. einreichen.",
    prioritaet: "hoch",
    status: "vorbereitet",
    helpyEmpfehlung: "Frist beachten — rechtzeitig Unterlagen vorbereiten.",
    intakeEventId: "det-email",
  },
  {
    id: "vorg-mueller-garantie",
    typ: "aufgabe",
    absender: "Klaus Berger · Müller GmbH",
    kunde: "Müller GmbH",
    zusammenfassung: "Rückfrage zu Garantie und Wartung für Büromöbel.",
    prioritaet: "mittel",
    status: "vorbereitet",
    helpyEmpfehlung: "Kurze Antwort mit Garantiebedingungen vorbereiten.",
    intakeEventId: "det-email",
  },
  {
    id: "vorg-techstart-vertrag",
    typ: "aufgabe",
    absender: "Lisa Wagner · TechStart AG",
    kunde: "TechStart AG",
    zusammenfassung: "Vertragsentwurf prüfen und Rückmeldung vorbereiten.",
    prioritaet: "mittel",
    status: "vorbereitet",
    helpyEmpfehlung: "Nach dem Erstgespräch gemeinsam bearbeiten.",
    intakeEventId: "det-email",
  },
  {
    id: "vorg-weber-angebot",
    typ: "angebot",
    absender: "Thomas Müller · Weber & Co. GmbH",
    kunde: "Weber & Co. GmbH",
    zusammenfassung:
      "Verbindliches Angebot für 45 Arbeitsplätze inkl. Schreibtische.",
    prioritaet: "hoch",
    status: "vorbereitet",
    helpyEmpfehlung:
      "Zuerst bearbeiten — hoher Auftragswert, Kunde wartet auf Rückmeldung.",
    intakeEventId: "det-angebot",
  },
  {
    id: "vorg-schmidt-angebot",
    typ: "angebot",
    absender: "Anna Hoffmann · Schmidt GmbH",
    kunde: "Schmidt GmbH",
    zusammenfassung:
      "Meetingraum komplett einrichten — 12 Personen, Medientechnik.",
    prioritaet: "hoch",
    status: "vorbereitet",
    helpyEmpfehlung: "Zweite Angebotsanfrage heute — gemeinsam priorisieren.",
    intakeEventId: "det-angebot",
  },
  {
    id: "vorg-sandra-termin",
    typ: "termin",
    absender: "Sandra Klein · Schmidt GmbH",
    kunde: "Schmidt GmbH",
    zusammenfassung: "Besprechung Q2-Planung — Dienstag, 14:00 Uhr.",
    prioritaet: "mittel",
    status: "vorbereitet",
    helpyEmpfehlung: "Termin prüfen und in den Kalender bestätigen.",
    intakeEventId: "det-termin",
  },
  {
    id: "vorg-techstart-termin",
    typ: "termin",
    absender: "Lisa Wagner · TechStart AG",
    kunde: "TechStart AG",
    zusammenfassung: "Erstgespräch Büroausstattung — Donnerstag, 10:30 Uhr.",
    prioritaet: "hoch",
    status: "vorbereitet",
    helpyEmpfehlung: "Neuer Interessent — Termin zeitnah bestätigen.",
    intakeEventId: "det-termin",
  },
  {
    id: "vorg-rechnung-logistik",
    typ: "rechnung",
    absender: "Müller Logistik AG",
    kunde: "Müller Logistik AG",
    zusammenfassung: "Rechnung Nr. 2024-0847 über 4.280,00 € zur Prüfung.",
    prioritaet: "mittel",
    status: "vorbereitet",
    helpyEmpfehlung: "Betrag und Leistungszeitraum gegen Vertrag prüfen.",
    intakeEventId: "det-rechnung",
  },
  {
    id: "vorg-creative-formular",
    typ: "formularanfrage",
    absender: "Marina Becker · Creative Studio",
    kunde: "Creative Studio",
    zusammenfassung:
      "Neue Kundenanfrage über Kontaktformular — 20 Arbeitsplätze, Erstausstattung.",
    prioritaet: "hoch",
    status: "vorbereitet",
    helpyEmpfehlung:
      "Neuer Lead — Kundenanfrage prüfen und Erstkontakt vorbereiten.",
    intakeEventId: "det-formular",
  },
];

export const INTAKE_PANEL_TITLE = "HELPY";

export const INTAKE_PANEL_MESSAGE =
  "Ich habe neue Eingänge geprüft und daraus vorbereitete Vorgänge erstellt. Du musst nur noch prüfen und bestätigen.";

export const INTAKE_PANEL_RECOMMENDATION = "";

export const INTAKE_FEEDBACK_MESSAGE =
  "Alles klar, ich habe den Vorgang aktualisiert.";

export const INTAKE_ACTIVITY_TIMELINE: IntakeTimelineEntry[] = [
  { id: "tl-1", time: "09:14", label: "Neue E-Mail erkannt" },
  { id: "tl-2", time: "09:14", label: "Formularanfrage erkannt" },
  { id: "tl-3", time: "09:15", label: "Angebotsanfrage vorbereitet" },
  { id: "tl-4", time: "09:15", label: "Terminwunsch erkannt" },
  { id: "tl-5", time: "09:16", label: "Aufgabe erstellt" },
];

export function createInitialVorgaenge(): IntakeVorgang[] {
  return MOCK_INTAKE_VORGAENGE.map((v) => ({ ...v, status: "vorbereitet" }));
}

export function getIntakeSummary(vorgaenge: IntakeVorgang[]): IntakeSummary[] {
  const counts: Record<IntakeVorgang["typ"], number> = {
    aufgabe: 0,
    angebot: 0,
    termin: 0,
    rechnung: 0,
    formularanfrage: 0,
  };

  for (const v of vorgaenge) {
    counts[v.typ]++;
  }

  return [
    { typ: "aufgabe", label: "Aufgaben", count: counts.aufgabe },
    { typ: "angebot", label: "Angebote", count: counts.angebot },
    { typ: "termin", label: "Termine", count: counts.termin },
    { typ: "rechnung", label: "Rechnungen", count: counts.rechnung },
    {
      typ: "formularanfrage",
      label: "Kundenanfragen",
      count: counts.formularanfrage,
    },
  ];
}
