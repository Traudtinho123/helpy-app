import type {
  ConnectEvent,
  ConnectorRecord,
} from "@/features/platforms/services/connect/connector-types";
import { staticTimeFromIso } from "@/features/workspace/services/status/time-utils";

const MOCK_DATE = "2026-07-07";

export const MOCK_CONNECTORS: ConnectorRecord[] = [
  {
    id: "gmail",
    name: "Gmail",
    icon: "📧",
    status: "connected",
    skill: "all",
    connected: true,
    lastSync: `${MOCK_DATE}T08:12:00+02:00`,
    eventCount: 24,
  },
  {
    id: "outlook",
    name: "Outlook",
    icon: "📨",
    status: "connected",
    skill: "all",
    connected: true,
    lastSync: `${MOCK_DATE}T07:55:00+02:00`,
    eventCount: 18,
  },
  {
    id: "immoscout24-ch",
    name: "ImmoScout24.ch",
    icon: "🏡",
    status: "connected",
    skill: "real-estate",
    connected: true,
    lastSync: `${MOCK_DATE}T08:15:00+02:00`,
    eventCount: 12,
  },
  {
    id: "homegate",
    name: "Homegate",
    icon: "🏠",
    status: "connected",
    skill: "real-estate",
    connected: true,
    lastSync: `${MOCK_DATE}T07:30:00+02:00`,
    eventCount: 8,
  },
  {
    id: "newhome",
    name: "Newhome",
    icon: "🔑",
    status: "available",
    skill: "real-estate",
    connected: false,
    lastSync: null,
    eventCount: 0,
  },
  {
    id: "website",
    name: "Website",
    icon: "🌐",
    status: "connected",
    skill: "all",
    connected: true,
    lastSync: `${MOCK_DATE}T08:17:00+02:00`,
    eventCount: 6,
  },
  {
    id: "kontaktformulare",
    name: "Kontaktformulare",
    icon: "📝",
    status: "connected",
    skill: "all",
    connected: true,
    lastSync: `${MOCK_DATE}T08:17:00+02:00`,
    eventCount: 9,
  },
  {
    id: "whatsapp-business",
    name: "WhatsApp Business",
    icon: "💬",
    status: "connected",
    skill: "all",
    connected: true,
    lastSync: `${MOCK_DATE}T08:20:00+02:00`,
    eventCount: 15,
  },
  {
    id: "google-calendar",
    name: "Google Kalender",
    icon: "📅",
    status: "connected",
    skill: "all",
    connected: true,
    lastSync: `${MOCK_DATE}T08:05:00+02:00`,
    eventCount: 11,
  },
  {
    id: "microsoft-calendar",
    name: "Microsoft Kalender",
    icon: "🗓",
    status: "connected",
    skill: "all",
    connected: true,
    lastSync: `${MOCK_DATE}T08:00:00+02:00`,
    eventCount: 7,
  },
  {
    id: "facebook-leads",
    name: "Facebook Leads",
    icon: "📣",
    status: "available",
    skill: "real-estate",
    connected: false,
    lastSync: null,
    eventCount: 0,
  },
];

/** Beispiel-Events für HELPY Event Queue (Morgen-Szenario) */
export const MOCK_CONNECT_EVENTS: ConnectEvent[] = [
  {
    id: "evt-1",
    connector: "gmail",
    type: "neue-email",
    title: "Angebotsanfrage: Büroausstattung für 45 Arbeitsplätze",
    customer: "Thomas Müller · Weber & Co. GmbH",
    priority: "hoch",
    createdAt: `${MOCK_DATE}T08:12:00+02:00`,
    status: "neu",
    payload: {
      absender: "t.mueller@weber-co.de",
      betreff: "Angebotsanfrage: Büroausstattung für 45 Arbeitsplätze",
      vorschau: "Bitte senden Sie uns ein verbindliches Angebot bis Freitag.",
    },
  },
  {
    id: "evt-2",
    connector: "immoscout24-ch",
    type: "neue-immobilienanfrage",
    title: "Interessent für Penthouse Leopoldstraße",
    customer: "Familie Hoffmann",
    priority: "hoch",
    createdAt: `${MOCK_DATE}T08:15:00+02:00`,
    status: "neu",
    payload: {
      objektId: "IS24-88421",
      objekt: "Penthouse Leopoldstraße, München",
      wunsch: "Besichtigung am Abend",
    },
  },
  {
    id: "evt-3",
    connector: "website",
    type: "neues-kontaktformular",
    title: "Kontaktformular: Beratungsanfrage Gewerbemietrecht",
    customer: "Weber & Co. GmbH",
    priority: "mittel",
    createdAt: `${MOCK_DATE}T08:17:00+02:00`,
    status: "neu",
    payload: {
      formular: "Kontakt — Startseite",
      nachricht: "Wir benötigen eine Erstberatung zu Gewerbemietvertrag.",
    },
  },
  {
    id: "evt-4",
    connector: "whatsapp-business",
    type: "neue-whatsapp-nachricht",
    title: "Rückruf gewünscht — Sanitärinstallation",
    customer: "Klaus Berger · Berger Bau GmbH",
    priority: "hoch",
    createdAt: `${MOCK_DATE}T08:20:00+02:00`,
    status: "neu",
    payload: {
      nachricht: "Können Sie mich bitte heute Vormittag zurückrufen?",
      telefon: "+49 89 555 123 45",
    },
  },
  {
    id: "evt-5",
    connector: "outlook",
    type: "neue-offertanfrage",
    title: "Offertanfrage: Fassadensanierung",
    customer: "Anna Richter · ImmoService Richter",
    priority: "mittel",
    createdAt: `${MOCK_DATE}T08:22:00+02:00`,
    status: "neu",
    payload: {
      flaeche: "850 m²",
      frist: "14.07.2026",
    },
  },
  {
    id: "evt-6",
    connector: "google-calendar",
    type: "neuer-kalendereintrag",
    title: "Besichtigungstermin — Weber & Co.",
    customer: "Thomas Müller",
    priority: "mittel",
    createdAt: `${MOCK_DATE}T08:25:00+02:00`,
    status: "neu",
    payload: {
      termin: "10.07.2026, 18:30 Uhr",
      ort: "Industriestraße 12, München",
    },
  },
  {
    id: "evt-7",
    connector: "homegate",
    type: "neue-immobilienanfrage",
    title: "Anfrage Eigentumswohnung Sendling",
    customer: "Unbekannt (Homegate)",
    priority: "niedrig",
    createdAt: `${MOCK_DATE}T08:28:00+02:00`,
    status: "neu",
    payload: {
      objekt: "3-Zimmer-Wohnung Sendling",
      budget: "650.000 EUR",
    },
  },
  {
    id: "evt-8",
    connector: "microsoft-calendar",
    type: "frist-erkannt",
    title: "Frist: Stellungnahme Finanzamt",
    customer: "Finanzamt München",
    priority: "hoch",
    createdAt: `${MOCK_DATE}T08:30:00+02:00`,
    status: "neu",
    payload: {
      frist: "10.07.2026",
      mandat: "Steuerliche Sonderprüfung",
    },
  },
  {
    id: "evt-9",
    connector: "gmail",
    type: "neue-datei",
    title: "Anhang: Grundriss Büroetage.pdf",
    customer: "Thomas Müller · Weber & Co. GmbH",
    priority: "niedrig",
    createdAt: `${MOCK_DATE}T08:32:00+02:00`,
    status: "neu",
    payload: {
      dateiname: "Grundriss_Büroetage.pdf",
      groesse: "2,4 MB",
    },
  },
  {
    id: "evt-10",
    connector: "google-calendar",
    type: "terminaenderung",
    title: "Termin verschoben: Erstgespräch TechStart",
    customer: "Julia Hoffmann · TechStart AG",
    priority: "mittel",
    createdAt: `${MOCK_DATE}T08:35:00+02:00`,
    status: "neu",
    payload: {
      alt: "08.07.2026, 14:00",
      neu: "09.07.2026, 10:00",
    },
  },
];

/** Events gruppiert nach Connector für Mock-Sync */
export function getMockEventsByConnector(): Map<
  ConnectEvent["connector"],
  ConnectEvent[]
> {
  const map = new Map<ConnectEvent["connector"], ConnectEvent[]>();

  for (const event of MOCK_CONNECT_EVENTS) {
    const list = map.get(event.connector) ?? [];
    list.push(event);
    map.set(event.connector, list);
  }

  return map;
}

export function formatQueueTime(iso: string): string {
  return staticTimeFromIso(iso);
}

export function getQueueDisplayLabel(event: ConnectEvent): string {
  const time = formatQueueTime(event.createdAt);
  const connector = MOCK_CONNECTORS.find((c) => c.id === event.connector);
  const connectorName = connector?.name ?? event.connector;
  return `${time} ${connectorName}\n→ ${event.title.split(":")[0] || event.title}`;
}
