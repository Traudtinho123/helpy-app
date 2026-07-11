import type {
  BrainQueueItemResult,
  ConnectEvent,
} from "@/features/platforms/services/connect/connector-types";
import { getEventTypeLabel } from "@/features/platforms/services/connect/event-types";

/** Brain v1 Mock-Verarbeitung — aus Connect-Engine extrahiert (Event Bus). */
export function processEventForBrain(event: ConnectEvent): BrainQueueItemResult {
  const typeLabel = getEventTypeLabel(event.type);

  const actionMap: Record<ConnectEvent["type"], string> = {
    "neue-email": "E-Mail prüfen und Antwort vorbereiten",
    "neue-immobilienanfrage": "Interessent kontaktieren und Besichtigung vorschlagen",
    "neue-offertanfrage": "Offerte vorbereiten und Vor-Ort-Termin prüfen",
    "neues-kontaktformular": "Kontaktanfrage beantworten",
    "neuer-kalendereintrag": "Termin im Kalender bestätigen",
    "neue-whatsapp-nachricht": "Rückruf einplanen",
    "neue-facebook-lead": "Lead qualifizieren und Erstgespräch vorschlagen",
    "neue-datei": "Datei zum Vorgang zuordnen",
    terminaenderung: "Kalender und Beteiligte aktualisieren",
    "frist-erkannt": "Frist im Kalender sichern und Vorgang priorisieren",
  };

  const kategorieMap: Partial<Record<ConnectEvent["type"], string>> = {
    "neue-email": "E-Mail",
    "neue-immobilienanfrage": "Immobilie",
    "neue-offertanfrage": "Angebot",
    "neues-kontaktformular": "Kontakt",
    "neuer-kalendereintrag": "Termin",
    "neue-whatsapp-nachricht": "Kommunikation",
    "neue-facebook-lead": "Lead",
    "neue-datei": "Dokument",
    terminaenderung: "Termin",
    "frist-erkannt": "Frist",
  };

  return {
    eventId: event.id,
    connector: event.connector,
    type: event.type,
    title: event.title,
    priority: event.priority,
    helpyMessage: `${typeLabel} von ${event.customer} — bereit zur Weiterverarbeitung.`,
    suggestedAction: actionMap[event.type],
    vorgangKategorie: kategorieMap[event.type],
    processedAt: "2026-07-07T12:00:00+02:00",
  };
}
