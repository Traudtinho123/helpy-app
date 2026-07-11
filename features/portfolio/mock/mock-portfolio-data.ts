import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import type { ObjektEnrichment } from "@/features/portfolio/types/objekt-portfolio-types";

const now = "2026-07-08T10:00:00.000Z";
const yesterday = "2026-07-07T14:30:00.000Z";
const twoDaysAgo = "2026-07-06T09:15:00.000Z";

export const MOCK_PORTFOLIO_OBJECTS: RealEstateObject[] = [
  {
    objectId: "obj-bahnhofstrasse-12-zuerich",
    quelle: "ImmoScout24.ch",
    adresse: "Bahnhofstrasse 12",
    plz: "8001",
    ort: "Zürich",
    land: "Schweiz",
    titel: "3.5-Zimmer-Wohnung",
    beschreibung:
      "Zentrale Lage, helle Räume, Balkon und Lift. Ideal für Familien oder Paare.",
    transaktion: "Kauf",
    preis: "CHF 950'000",
    zimmer: "3.5",
    wohnflaeche: "112 m²",
    stockwerk: "3. OG",
    objektLink: "https://www.immoscout24.ch/expose/bahnhofstrasse-12",
    status: "aktiv",
    aktiv: true,
    interessentLinks: [],
    vorgangIds: [],
    besichtigungIds: ["bes-1", "bes-2", "bes-3", "bes-4", "bes-5", "bes-6", "bes-7", "bes-8"],
    dokumentIds: [],
    images: [],
    createdAt: twoDaysAgo,
    updatedAt: now,
  },
  {
    objectId: "link-https-immoscout24-ch-expose-12345678",
    quelle: "ImmoScout24.ch",
    adresse: "Seestrasse 42",
    plz: "8002",
    ort: "Zürich",
    land: "Schweiz",
    titel: "3.5-Zi-Wohnung mit Seesicht",
    beschreibung: "Helle Wohnung in zentraler Lage, Balkon, Lift vorhanden.",
    transaktion: "Miete",
    preis: "CHF 3'200",
    zimmer: "3.5",
    wohnflaeche: "98 m²",
    stockwerk: "4. OG",
    objektLink: "https://www.immoscout24.ch/expose/12345678",
    status: "aktiv",
    aktiv: true,
    interessentLinks: [],
    vorgangIds: [],
    besichtigungIds: ["bes-s1", "bes-s2", "bes-s3"],
    dokumentIds: [],
    images: [],
    createdAt: twoDaysAgo,
    updatedAt: yesterday,
  },
  {
    objectId: "obj-homegate-maisonette-bern",
    quelle: "Homegate",
    adresse: "Musterweg 8",
    plz: "3000",
    ort: "Bern",
    land: "Schweiz",
    titel: "Maisonette mit Garten",
    beschreibung: "Geräumige Maisonette mit privatem Gartenanteil und zwei Parkplätzen.",
    transaktion: "Kauf",
    preis: "CHF 1'180'000",
    zimmer: "4.5",
    wohnflaeche: "145 m²",
    stockwerk: "EG / 1. OG",
    objektLink: "https://www.homegate.ch/obj/homegate-maisonette-bern",
    status: "aktiv",
    aktiv: true,
    interessentLinks: [],
    vorgangIds: [],
    besichtigungIds: ["bes-h1", "bes-h2"],
    dokumentIds: [],
    images: [],
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
  },
];

export const MOCK_PORTFOLIO_ENRICHMENT: Record<string, ObjektEnrichment> = {
  "obj-bahnhofstrasse-12-zuerich": {
    baujahr: "1998",
    verfuegbarkeit: "Ab sofort",
    interessenten: [
      {
        vorgangId: "vorgang-mueller",
        name: "Thomas Müller",
        email: "thomas.mueller@example.com",
        status: "Besichtigung geplant",
        letzteAktivitaet: "Heute, 09:42",
      },
      {
        vorgangId: "vorgang-schmid",
        name: "Laura Schmid",
        email: "laura.schmid@example.com",
        status: "Exposé angefordert",
        letzteAktivitaet: "Gestern, 16:20",
      },
      {
        vorgangId: "vorgang-weber",
        name: "Familie Weber",
        email: "weber.familie@example.com",
        status: "Neue Anfrage",
        letzteAktivitaet: "Gestern, 11:05",
      },
      {
        vorgangId: "vorgang-keller",
        name: "Sandra Keller",
        email: "sandra.keller@example.com",
        status: "Rückmeldung offen",
        letzteAktivitaet: "07.07.2026",
      },
      {
        vorgangId: "vorgang-brun",
        name: "Marco Brun",
        email: "marco.brun@example.com",
        status: "Besichtigung bestätigt",
        letzteAktivitaet: "06.07.2026",
      },
    ],
    besichtigungen: [
      {
        id: "bes-1",
        datum: "12.07.2026",
        uhrzeit: "14:00",
        interessent: "Thomas Müller",
        status: "Geplant",
        kalenderquelle: "Apple Kalender",
      },
      {
        id: "bes-2",
        datum: "10.07.2026",
        uhrzeit: "17:30",
        interessent: "Marco Brun",
        status: "Bestätigt",
        kalenderquelle: "Google Kalender",
      },
      {
        id: "bes-3",
        datum: "08.07.2026",
        uhrzeit: "11:00",
        interessent: "Laura Schmid",
        status: "Durchgeführt",
        kalenderquelle: "Apple Kalender",
      },
    ],
    kommunikation: [
      {
        id: "kom-1",
        quelle: "ImmoScout24.ch",
        betreff: "Anfrage zur 3.5-Zimmer-Wohnung",
        kunde: "Thomas Müller",
        datum: "08.07.2026",
        status: "Beantwortet",
      },
      {
        id: "kom-2",
        quelle: "Gmail",
        betreff: "Frage zur Garage",
        kunde: "Laura Schmid",
        datum: "07.07.2026",
        status: "Entwurf vorbereitet",
      },
      {
        id: "kom-3",
        quelle: "ImmoScout24.ch",
        betreff: "Besichtigungstermin Wunsch",
        kunde: "Familie Weber",
        datum: "07.07.2026",
        status: "Neu",
      },
    ],
    helpyWissen: [
      "Viele Interessenten fragen nach Garage.",
      "Besichtigungen werden häufig am Nachmittag gewünscht.",
      "Exposé wurde mehrfach angefragt.",
    ],
  },
  "link-https-immoscout24-ch-expose-12345678": {
    baujahr: "2005",
    verfuegbarkeit: "Per 01.09.2026",
    interessenten: [
      {
        vorgangId: "vorgang-seeli",
        name: "Anna Seeli",
        email: "anna.seeli@example.com",
        status: "Besichtigung geplant",
        letzteAktivitaet: "Gestern, 10:15",
      },
      {
        vorgangId: "vorgang-frei",
        name: "Jonas Frei",
        email: "jonas.frei@example.com",
        status: "Neue Anfrage",
        letzteAktivitaet: "06.07.2026",
      },
    ],
    besichtigungen: [
      {
        id: "bes-s1",
        datum: "14.07.2026",
        uhrzeit: "10:30",
        interessent: "Anna Seeli",
        status: "Geplant",
        kalenderquelle: "Google Kalender",
      },
      {
        id: "bes-s2",
        datum: "05.07.2026",
        uhrzeit: "16:00",
        interessent: "Jonas Frei",
        status: "Durchgeführt",
        kalenderquelle: "Apple Kalender",
      },
    ],
    kommunikation: [
      {
        id: "kom-s1",
        quelle: "ImmoScout24.ch",
        betreff: "Mietanfrage Seesicht",
        kunde: "Anna Seeli",
        datum: "07.07.2026",
        status: "Beantwortet",
      },
    ],
    helpyWissen: [
      "Interessenten fragen oft nach Seesicht und Balkon.",
      "Mietpreis wird häufig nachgefragt.",
    ],
  },
  "obj-homegate-maisonette-bern": {
    baujahr: "2012",
    verfuegbarkeit: "Nach Vereinbarung",
    interessenten: [
      {
        vorgangId: "vorgang-gerber",
        name: "Claudia Gerber",
        email: "claudia.gerber@example.com",
        status: "Exposé gesendet",
        letzteAktivitaet: "05.07.2026",
      },
    ],
    besichtigungen: [
      {
        id: "bes-h1",
        datum: "15.07.2026",
        uhrzeit: "15:00",
        interessent: "Claudia Gerber",
        status: "Geplant",
        kalenderquelle: "Apple Kalender",
      },
    ],
    kommunikation: [
      {
        id: "kom-h1",
        quelle: "Homegate",
        betreff: "Anfrage Maisonette Bern",
        kunde: "Claudia Gerber",
        datum: "05.07.2026",
        status: "Beantwortet",
      },
    ],
    helpyWissen: [
      "Garten und Parkplätze sind häufige Fragen.",
    ],
  },
};

/** Ergänzt Mock-Interessenten-Zahlen für Portfolio-Karten (15 / 8 / 12 Beispiel). */
export const MOCK_PORTFOLIO_DISPLAY_COUNTS: Record<
  string,
  { interessenten: number; besichtigungen: number; dokumente: number; letzteAktivitaet: string }
> = {
  "obj-bahnhofstrasse-12-zuerich": {
    interessenten: 15,
    besichtigungen: 8,
    dokumente: 12,
    letzteAktivitaet: "Heute, 09:42",
  },
  "link-https-immoscout24-ch-expose-12345678": {
    interessenten: 6,
    besichtigungen: 3,
    dokumente: 5,
    letzteAktivitaet: "Gestern, 10:15",
  },
  "obj-homegate-maisonette-bern": {
    interessenten: 4,
    besichtigungen: 2,
    dokumente: 4,
    letzteAktivitaet: "05.07.2026",
  },
};
