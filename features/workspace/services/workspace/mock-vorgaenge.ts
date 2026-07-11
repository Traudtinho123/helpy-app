import type { Vorgang } from "@/features/workspace/services/workspace/types";

const WEBER_VORGANG: Vorgang = {
  id: "weber-angebot",
  skill: "construction",
  kunde: {
    firmenname: "Weber & Co. GmbH",
    ansprechpartner: "Thomas Müller",
    email: "thomas.mueller@weber-co.de",
    telefon: "+49 89 1234 5678",
    adresse: "Maximilianstraße 12, 80539 München",
    branche: "Büroausstattung · Gewerbe",
    status: "Bestandskunde",
  },
  aufgabe: {
    titel: "Angebot Weber & Co. versenden",
    kategorie: "Angebot",
    deadline: "Freitag",
    fortschritt: 65,
    empfohleneAktion: "Angebot prüfen und an Thomas Müller senden",
  },
  letzteEmail: {
    betreff: "Angebotsanfrage: Büroausstattung für 45 Arbeitsplätze",
    absender: "Thomas Müller",
    datum: "Heute, 08:42",
    inhalt: `Guten Tag Frau Traud,

wir benötigen für unser neues Büro 45 Arbeitsplätze inklusive Schreibtischen, Stühlen und Lieferung bis Freitag. Bitte senden Sie uns ein verbindliches Angebot.

Viele Grüße
Thomas Müller`,
    zusammenfassung:
      "Verbindliches Angebot für 45 Arbeitsplätze — Deadline Freitag. Budgetrahmen ca. 85.000 €.",
  },
  angebot: {
    angebotNr: "A-2026-0147",
    status: "Entwurf",
    deadline: "Freitag",
    mwstSatz: 19,
    positionen: [
      {
        bezeichnung: "Höhenverstellbarer Schreibtisch Premium (160×80 cm)",
        menge: 45,
        einzelpreis: 890,
      },
      {
        bezeichnung: "Ergonomischer Bürostuhl Pro",
        menge: 45,
        einzelpreis: 620,
      },
      {
        bezeichnung: "Lieferung, Montage und Entsorgung Alt-Möbel",
        menge: 1,
        einzelpreis: 4800,
      },
    ],
  },
  termine: [
    {
      titel: "Besprechung Angebot",
      datum: "Dienstag, 14:00 Uhr",
      ort: "Weber & Co. GmbH · München",
    },
    {
      titel: "Follow-up Telefonat",
      datum: "Donnerstag, 10:00 Uhr",
    },
  ],
  dokumente: [
    { name: "Grundriss_Büro_Neu.pdf", typ: "PDF", datum: "05.07.2026" },
    { name: "Angebot_A-2026-0147_Entwurf.pdf", typ: "PDF", datum: "06.07.2026" },
    { name: "Referenzliste_Gewerbe.docx", typ: "Word", datum: "28.06.2026" },
  ],
  notizen:
    "Thomas bevorzugt E-Mail-Kommunikation. Express-Lieferung gewünscht. Beim letzten Projekt 2025 pünktliche Zahlung.",
  helpy: {
    begruessung: "Du arbeitest gerade an: Weber & Co.",
    empfehlung:
      "Das Angebot ist zu 65 % fertig. Ich würde zuerst die Lieferposition prüfen und dann direkt versenden — der Kunde wartet seit 3 Tagen.",
    naechsterSchritt: "Angebot A-2026-0147 finalisieren und versenden",
  },
};

const VORGAENGE: Record<string, Vorgang> = {
  "weber-angebot": WEBER_VORGANG,
  "finanzamt-steuer": {
    id: "finanzamt-steuer",
    skill: "consulting-legal",
    kunde: {
      firmenname: "Finanzamt München",
      ansprechpartner: "Steuerbescheid 2024",
      email: "elster@finanzamt.de",
      telefon: "—",
      adresse: "Einwurfstelle Elster-Portal",
      status: "Behörde",
    },
    aufgabe: {
      titel: "Steuerbescheid prüfen",
      kategorie: "Behörde",
      deadline: "Einspruchsfrist 4 Wochen",
      fortschritt: 20,
      empfohleneAktion: "Bescheid im Elster-Portal prüfen",
    },
    letzteEmail: {
      betreff: "Steuerbescheid 2024 — Einspruchsfrist beachten",
      absender: "Finanzamt München",
      datum: "Heute, 07:30",
      inhalt:
        "Ihr Steuerbescheid für das Veranlagungsjahr 2024 steht im Elster-Portal zur Verfügung. Die Einspruchsfrist beträgt einen Monat.",
      zusammenfassung:
        "Steuerbescheid 2024 verfügbar — Einspruchsfrist beachten, ggf. Steuerberater informieren.",
    },
    termine: [],
    dokumente: [
      { name: "Steuerbescheid_2024.pdf", typ: "PDF", datum: "06.07.2026" },
    ],
    notizen: "Steuerberater Dr. Werner informieren, sobald Bescheid geprüft.",
    helpy: {
      begruessung: "Du arbeitest gerade an: Finanzamt München",
      empfehlung:
        "Ich würde den Bescheid heute sichten und die Einspruchsfrist im Kalender eintragen.",
      naechsterSchritt: "Elster-Portal öffnen und Bescheid prüfen",
    },
  },
  "sandra-termin": {
    id: "sandra-termin",
    skill: "consulting-legal",
    kunde: {
      firmenname: "Schmidt GmbH",
      ansprechpartner: "Sandra Klein",
      email: "sandra.klein@schmidt-gmbh.de",
      telefon: "+49 30 9876 5432",
      adresse: "Friedrichstraße 88, 10117 Berlin",
      branche: "Dienstleistung",
      status: "Interessent",
    },
    aufgabe: {
      titel: "Termin mit Sandra Klein vorbereiten",
      kategorie: "Termin",
      deadline: "Heute, 14:00 Uhr",
      fortschritt: 40,
      empfohleneAktion: "Gesprächsvorbereitung und Kalendereinladung",
    },
    letzteEmail: {
      betreff: "Terminvorschlag: Besprechung Q2-Planung",
      absender: "Sandra Klein",
      datum: "Gestern, 14:22",
      inhalt:
        "Hallo Martina, könnten wir uns nächste Woche Dienstag um 14:00 Uhr zu unserer Q2-Planung austauschen?",
      zusammenfassung:
        "Terminvorschlag Dienstag 14:00 — Q2-Planung, Interesse an Wartungsvertrag.",
    },
    angebot: {
      angebotNr: "A-2026-0095",
      status: "In Arbeit",
      mwstSatz: 19,
      positionen: [
        {
          bezeichnung: "Jährlicher Wartungsvertrag (12 Monate)",
          menge: 1,
          einzelpreis: 2400,
        },
      ],
    },
    termine: [
      {
        titel: "Q2-Planung · Telefonat",
        datum: "Heute, 14:00 Uhr",
        ort: "Telefon / Teams",
      },
    ],
    dokumente: [
      { name: "Wartungsvertrag_Entwurf.pdf", typ: "PDF", datum: "01.07.2026" },
    ],
    notizen: "Beim letzten Gespräch Interesse an 3 Standorten — Nachfrage vorbereiten.",
    helpy: {
      begruessung: "Du arbeitest gerade an: Schmidt GmbH",
      empfehlung:
        "Der Termin ist heute um 14:00 Uhr. Ich würde das Wartungsangebot kurz parat haben.",
      naechsterSchritt: "Gesprächsnotizen und Angebot A-2026-0095 öffnen",
    },
  },
  "mueller-rueckfrage": {
    id: "mueller-rueckfrage",
    skill: "construction",
    kunde: {
      firmenname: "Müller GmbH",
      ansprechpartner: "Klaus Berger",
      email: "k.berger@mueller-gmbh.de",
      telefon: "+49 89 5555 9999",
      adresse: "Industrieweg 7, 80999 München",
      status: "Bestandskunde",
    },
    aufgabe: {
      titel: "Rückfrage Müller GmbH beantworten",
      kategorie: "E-Mail",
      deadline: "Heute",
      fortschritt: 30,
      empfohleneAktion: "Antwort im Posteingang verfassen",
    },
    letzteEmail: {
      betreff: "Nachfrage zu Angebot Nr. A-2024-112",
      absender: "Klaus Berger",
      datum: "Montag, 11:30",
      inhalt:
        "Guten Tag, wir haben Ihr Angebot erhalten und hätten noch Fragen zur Garantie und Wartung.",
      zusammenfassung:
        "Rückfrage zu Garantie- und Wartungsbedingungen für Angebot A-2024-112.",
    },
    angebot: {
      angebotNr: "A-2024-112",
      status: "Gesendet",
      mwstSatz: 19,
      positionen: [
        {
          bezeichnung: "Sanitärinstallation Neubau",
          menge: 24,
          einzelpreis: 3200,
        },
      ],
    },
    termine: [],
    dokumente: [
      { name: "Angebot_A-2024-112.pdf", typ: "PDF", datum: "28.06.2026" },
    ],
    notizen: "Garantie 24 Monate — Wartung optional als Servicevertrag.",
    helpy: {
      begruessung: "Du arbeitest gerade an: Müller GmbH",
      empfehlung:
        "Klaus Berger wartet auf Klarstellung zu Garantie und Wartung — eine präzise Antwort stärkt den Abschluss.",
      naechsterSchritt: "Antwortentwurf mit Garantiebedingungen senden",
    },
  },
  "schmidt-angebot": {
    id: "schmidt-angebot",
    skill: "consulting-legal",
    kunde: {
      firmenname: "Schmidt GmbH",
      ansprechpartner: "Sandra Klein",
      email: "sandra.klein@schmidt-gmbh.de",
      telefon: "+49 30 9876 5432",
      adresse: "Friedrichstraße 88, 10117 Berlin",
      status: "Interessent",
    },
    aufgabe: {
      titel: "Angebot Schmidt GmbH fertigstellen",
      kategorie: "Angebot",
      deadline: "Diese Woche",
      fortschritt: 80,
      empfohleneAktion: "Entwurf prüfen und freigeben",
    },
    letzteEmail: {
      betreff: "Wartungsvertrag — Rückmeldung erwartet",
      absender: "Sandra Klein",
      datum: "03.07.2026",
      inhalt: "Wir freuen uns auf Ihr Angebot zum Wartungsvertrag für unsere Standorte.",
      zusammenfassung: "Wartungsangebot für 3 Standorte — Entwurf fast fertig.",
    },
    angebot: {
      angebotNr: "A-2026-0095",
      status: "Warten auf Freigabe",
      mwstSatz: 19,
      positionen: [
        {
          bezeichnung: "Jährlicher Wartungsvertrag (12 Monate)",
          menge: 1,
          einzelpreis: 2400,
        },
      ],
    },
    termine: [],
    dokumente: [
      { name: "Angebot_A-2026-0095_Entwurf.pdf", typ: "PDF", datum: "03.07.2026" },
    ],
    notizen: "Freigabe durch Geschäftsführung noch ausstehend.",
    helpy: {
      begruessung: "Du arbeitest gerade an: Schmidt GmbH",
      empfehlung:
        "Das Angebot ist fast fertig — ich würde die Freigabe einholen und diese Woche versenden.",
      naechsterSchritt: "Angebot A-2026-0095 freigeben lassen",
    },
  },
  "techstart-neu": {
    id: "techstart-neu",
    skill: "real-estate",
    kunde: {
      firmenname: "TechStart AG",
      ansprechpartner: "Lisa Wagner",
      email: "lisa@techstart-solutions.de",
      telefon: "+49 221 4444 7890",
      adresse: "Mediapark 8, 50670 Köln",
      branche: "Startup · KI",
      status: "Neuer Kunde",
    },
    aufgabe: {
      titel: "Erstkontakt TechStart AG",
      kategorie: "Neuer Kunde",
      deadline: "Heute",
      fortschritt: 10,
      empfohleneAktion: "Willkommensmail und Erstgespräch anbieten",
    },
    letzteEmail: {
      betreff: "Erstkontakt — Interesse an Büroausstattung",
      absender: "Lisa Wagner",
      datum: "Heute, 08:30",
      inhalt:
        "Lisa Wagner über LinkedIn — Interesse an Büroausstattung für 25 Mitarbeiter.",
      zusammenfassung: "Frischer Lead — Startup mit 25 Mitarbeitern, heute antworten.",
    },
    termine: [],
    dokumente: [],
    notizen: "Lead über LinkedIn — Erstgespräch diese Woche anbieten.",
    helpy: {
      begruessung: "Du arbeitest gerade an: TechStart AG",
      empfehlung:
        "Frischer Lead ohne Historie — ich würde heute noch antworten und ein Erstgespräch vorschlagen.",
      naechsterSchritt: "Willkommensmail mit Terminvorschlag senden",
    },
  },
};

export function getVorgang(id: string): Vorgang | null {
  return VORGAENGE[id] ?? null;
}

export function getVorgangPath(id: string): string {
  return `/workspace/${id}`;
}

export const DEFAULT_VORGANG_ID = "weber-angebot";
