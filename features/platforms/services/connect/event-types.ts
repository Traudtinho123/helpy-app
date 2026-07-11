import type { ConnectEventType, ConnectorId } from "@/features/platforms/services/connect/connector-types";

export const CONNECT_EVENT_TYPE_LABELS: Record<ConnectEventType, string> = {
  "neue-email": "Neue E-Mail",
  "neue-immobilienanfrage": "Neue Immobilienanfrage",
  "neue-offertanfrage": "Neue Offertanfrage",
  "neues-kontaktformular": "Neues Kontaktformular",
  "neuer-kalendereintrag": "Neuer Kalendereintrag",
  "neue-whatsapp-nachricht": "Neue WhatsApp Nachricht",
  "neue-facebook-lead": "Neue Facebook Lead",
  "neue-datei": "Neue Datei",
  terminaenderung: "Terminänderung",
  "frist-erkannt": "Frist erkannt",
};

/** Welche Event-Typen ein Connector typischerweise liefert */
export const CONNECTOR_EVENT_TYPES: Record<ConnectorId, ConnectEventType[]> = {
  gmail: ["neue-email", "neue-datei", "frist-erkannt"],
  outlook: ["neue-email", "neue-datei", "frist-erkannt"],
  "immoscout24-ch": ["neue-immobilienanfrage", "neues-kontaktformular"],
  homegate: ["neue-immobilienanfrage"],
  newhome: ["neue-immobilienanfrage"],
  website: ["neues-kontaktformular", "neue-offertanfrage"],
  kontaktformulare: ["neues-kontaktformular", "neue-offertanfrage"],
  "whatsapp-business": ["neue-whatsapp-nachricht"],
  "google-calendar": ["neuer-kalendereintrag", "terminaenderung", "frist-erkannt"],
  "microsoft-calendar": [
    "neuer-kalendereintrag",
    "terminaenderung",
    "frist-erkannt",
  ],
  "facebook-leads": ["neue-facebook-lead"],
};

export function getEventTypeLabel(type: ConnectEventType): string {
  return CONNECT_EVENT_TYPE_LABELS[type];
}

export function getConnectorEventTypes(connectorId: ConnectorId): ConnectEventType[] {
  return CONNECTOR_EVENT_TYPES[connectorId];
}
