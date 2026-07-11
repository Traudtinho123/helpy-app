import type {
  AutopilotEmail,
  PreparedVorgang,
  VorgangSummary,
} from "@/features/brain/services/autopilot/types";

export const MOCK_INCOMING_EMAILS: AutopilotEmail[] = [
  {
    id: "mail-01",
    absender: "Thomas Müller · Weber & Co. GmbH",
    betreff: "Angebotsanfrage: Büroausstattung für 45 Arbeitsplätze",
    receivedAt: "09:14",
    vorgangId: "vorg-weber-angebot",
  },
  {
    id: "mail-02",
    absender: "Finanzamt München",
    betreff: "Steuerbescheid 2025 — Frist zur Einreichung",
    receivedAt: "09:12",
    vorgangId: "vorg-steuerbescheid",
  },
  {
    id: "mail-03",
    absender: "Sandra Klein · Schmidt GmbH",
    betreff: "Terminvorschlag: Besprechung Q2-Planung",
    receivedAt: "09:10",
    vorgangId: "vorg-sandra-termin",
  },
  {
    id: "mail-04",
    absender: "Müller Logistik AG",
    betreff: "Rechnung Nr. 2024-0847 — 4.280,00 €",
    receivedAt: "09:08",
    vorgangId: "vorg-rechnung-logistik",
  },
  {
    id: "mail-05",
    absender: "Klaus Berger · Müller GmbH",
    betreff: "Nachfrage zu Garantie und Wartung",
    receivedAt: "09:06",
    vorgangId: "vorg-mueller-garantie",
  },
  {
    id: "mail-06",
    absender: "Lisa Wagner · TechStart AG",
    betreff: "Erstgespräch — Interesse an Büroausstattung",
    receivedAt: "09:04",
    vorgangId: "vorg-techstart-termin",
  },
  {
    id: "mail-07",
    absender: "Anna Hoffmann · Schmidt GmbH",
    betreff: "Angebotsanfrage: Meetingraum komplett einrichten",
    receivedAt: "09:02",
    vorgangId: "vorg-schmidt-angebot",
  },
  {
    id: "mail-08",
    absender: "Lisa Wagner · TechStart AG",
    betreff: "Vertragsentwurf zur Prüfung",
    receivedAt: "09:00",
    vorgangId: "vorg-techstart-vertrag",
  },
  {
    id: "mail-09",
    absender: "Branchenverband Büro & Workspace",
    betreff: "Newsletter: Trends 2026 im Bürodesign",
    receivedAt: "08:58",
    vorgangId: "vorg-newsletter",
  },
  {
    id: "mail-10",
    absender: "Team · Intern",
    betreff: "Kurzinfo: Büro geschlossen am Freitag",
    receivedAt: "08:55",
    vorgangId: "vorg-intern-info",
  },
];

export const MOCK_PREPARED_VORGAENGE: PreparedVorgang[] = [
  {
    id: "vorg-weber-angebot",
    typ: "angebot",
    absender: "Thomas Müller · Weber & Co. GmbH",
    kunde: "Weber & Co. GmbH",
    zusammenfassung:
      "Verbindliches Angebot für 45 Arbeitsplätze inkl. Schreibtische und Stauraum.",
    prioritaet: "hoch",
    status: "vorbereitet",
    helpyEmpfehlung:
      "Zuerst bearbeiten — hoher Auftragswert und Kunde wartet auf Rückmeldung.",
    emailId: "mail-01",
  },
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
    emailId: "mail-02",
  },
  {
    id: "vorg-sandra-termin",
    typ: "termin",
    absender: "Sandra Klein · Schmidt GmbH",
    kunde: "Schmidt GmbH",
    zusammenfassung: "Besprechung Q2-Planung — Dienstag, 14:00 Uhr vorgeschlagen.",
    prioritaet: "mittel",
    status: "vorbereitet",
    helpyEmpfehlung: "Termin prüfen und in den Kalender bestätigen.",
    emailId: "mail-03",
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
    emailId: "mail-04",
  },
  {
    id: "vorg-mueller-garantie",
    typ: "aufgabe",
    absender: "Klaus Berger · Müller GmbH",
    kunde: "Müller GmbH",
    zusammenfassung:
      "Rückfrage zu Garantie und Wartung für gelieferte Büromöbel.",
    prioritaet: "mittel",
    status: "vorbereitet",
    helpyEmpfehlung: "Kurze Antwort mit Garantiebedingungen vorbereiten.",
    emailId: "mail-05",
  },
  {
    id: "vorg-techstart-termin",
    typ: "termin",
    absender: "Lisa Wagner · TechStart AG",
    kunde: "TechStart AG",
    zusammenfassung: "Erstgespräch für Büroausstattung — Donnerstag, 10:30 Uhr.",
    prioritaet: "hoch",
    status: "vorbereitet",
    helpyEmpfehlung: "Neuer Interessent — Termin zeitnah bestätigen.",
    emailId: "mail-06",
  },
  {
    id: "vorg-schmidt-angebot",
    typ: "angebot",
    absender: "Anna Hoffmann · Schmidt GmbH",
    kunde: "Schmidt GmbH",
    zusammenfassung:
      "Meetingraum komplett einrichten — 12 Personen, inkl. Medientechnik.",
    prioritaet: "hoch",
    status: "vorbereitet",
    helpyEmpfehlung: "Zweite Angebotsanfrage heute — gemeinsam priorisieren.",
    emailId: "mail-07",
  },
  {
    id: "vorg-techstart-vertrag",
    typ: "aufgabe",
    absender: "Lisa Wagner · TechStart AG",
    kunde: "TechStart AG",
    zusammenfassung: "Vertragsentwurf prüfen und Rückmeldung vorbereiten.",
    prioritaet: "mittel",
    status: "vorbereitet",
    helpyEmpfehlung: "Nach dem Erstgespräch gemeinsam mit Angebot bearbeiten.",
    emailId: "mail-08",
  },
  {
    id: "vorg-newsletter",
    typ: "nachricht",
    absender: "Branchenverband Büro & Workspace",
    kunde: "Branchenverband",
    zusammenfassung: "Newsletter mit Branchentrends — keine Aktion erforderlich.",
    prioritaet: "niedrig",
    status: "vorbereitet",
    helpyEmpfehlung: "Optional lesen oder archivieren.",
    emailId: "mail-09",
  },
  {
    id: "vorg-intern-info",
    typ: "nachricht",
    absender: "Team · Intern",
    kunde: "Intern",
    zusammenfassung: "Kurzinfo: Büro am Freitag geschlossen.",
    prioritaet: "niedrig",
    status: "vorbereitet",
    helpyEmpfehlung: "Zur Kenntnis nehmen — kein Handlungsbedarf.",
    emailId: "mail-10",
  },
];

export const AUTOPILOT_EMAIL_COUNT = MOCK_INCOMING_EMAILS.length;

export const AUTOPILOT_RELEVANT_COUNT = MOCK_PREPARED_VORGAENGE.filter(
  (v) => v.typ !== "nachricht"
).length;

export function getVorgangSummary(): VorgangSummary[] {
  const counts: Record<string, number> = {
    aufgabe: 0,
    angebot: 0,
    termin: 0,
    rechnung: 0,
    nachricht: 0,
  };

  for (const v of MOCK_PREPARED_VORGAENGE) {
    counts[v.typ]++;
  }

  return [
    { typ: "aufgabe", label: "Aufgaben", count: counts.aufgabe },
    { typ: "angebot", label: "Angebote", count: counts.angebot },
    { typ: "termin", label: "Termine", count: counts.termin },
    { typ: "rechnung", label: "Rechnungen", count: counts.rechnung },
    { typ: "nachricht", label: "Nachrichten", count: counts.nachricht },
  ];
}

export function createInitialVorgaenge(): PreparedVorgang[] {
  return MOCK_PREPARED_VORGAENGE.map((v) => ({ ...v, status: "vorbereitet" }));
}
