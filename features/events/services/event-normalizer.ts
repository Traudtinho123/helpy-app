import type { ConnectEvent } from "@/features/platforms/services/connect/connector-types";
import type {
  ConnectEventBridgeInput,
  HelpyEvent,
  HelpyEventCategory,
  HelpyEventPriority,
  HelpyEventSource,
  HelpyEventType,
} from "@/features/events/types/event-types";

const CONNECTOR_TO_SOURCE: Record<string, HelpyEventSource> = {
  gmail: "gmail",
  outlook: "outlook",
  "immoscout24-ch": "immoscout24",
  homegate: "homegate",
  newhome: "newhome",
  website: "homepage",
  kontaktformulare: "homepage",
  "whatsapp-business": "whatsapp",
  "google-calendar": "calendar",
  "microsoft-calendar": "calendar",
  "facebook-leads": "facebook",
};

/** Legacy ConnectEventType → kanonischer HelpyEventType */
const CONNECT_TYPE_TO_HELPY: Record<string, HelpyEventType> = {
  "neue-email": "MailReceived",
  "neue-datei": "AttachmentFound",
  "frist-erkannt": "MailReceived",
  "neue-immobilienanfrage": "LeadReceived",
  "neue-offertanfrage": "LeadCreated",
  "neues-kontaktformular": "FormSubmitted",
  "neuer-kalendereintrag": "AppointmentCreated",
  terminaenderung: "AppointmentChanged",
  "neue-whatsapp-nachricht": "MessageReceived",
  "neue-facebook-lead": "LeadCreated",
};

const TYPE_TO_CATEGORY: Record<HelpyEventType, HelpyEventCategory> = {
  MailReceived: "mail",
  MailUpdated: "mail",
  AttachmentFound: "document",
  LeadReceived: "lead",
  VisitRequested: "lead",
  ObjectMatched: "lead",
  FormSubmitted: "form",
  LeadCreated: "lead",
  AppointmentCreated: "calendar",
  AppointmentChanged: "calendar",
  AppointmentCancelled: "calendar",
  MessageReceived: "message",
};

const CONNECT_PRIORITY_TO_HELPY: Record<
  "hoch" | "mittel" | "niedrig",
  HelpyEventPriority
> = {
  hoch: "hoch",
  mittel: "mittel",
  niedrig: "niedrig",
};

function resolveSource(connector: string): HelpyEventSource {
  return CONNECTOR_TO_SOURCE[connector] ?? "connect";
}

function buildDescription(
  type: HelpyEventType,
  customer: string,
  title: string
): string {
  return `${type} — ${customer}: ${title}`;
}

/** ConnectEvent → HelpyEvent (Legacy-Bridge für bestehende Mock-Daten). */
export function normalizeConnectEvent(event: ConnectEvent): HelpyEvent {
  const type = CONNECT_TYPE_TO_HELPY[event.type] ?? "MailReceived";
  const source = resolveSource(event.connector);

  return {
    id: event.id,
    source,
    category: TYPE_TO_CATEGORY[type],
    type,
    title: event.title,
    description: buildDescription(type, event.customer, event.title),
    createdAt: event.createdAt,
    payload: {
      ...event.payload,
      _connector: event.connector,
      _connectType: event.type,
    },
    priority: CONNECT_PRIORITY_TO_HELPY[event.priority],
    status: event.status,
    customer: event.customer,
  };
}

/** Inverse für Brain-Legacy-Pfad — gleiche Semantik wie zuvor. */
export function toConnectEvent(event: HelpyEvent): ConnectEvent {
  const connector =
    (event.payload._connector as ConnectEvent["connector"]) ?? "gmail";
  const connectType =
    (event.payload._connectType as ConnectEvent["type"]) ?? "neue-email";

  const priorityMap: Record<HelpyEventPriority, ConnectEvent["priority"]> = {
    kritisch: "hoch",
    hoch: "hoch",
    mittel: "mittel",
    niedrig: "niedrig",
  };

  const { _connector, _connectType, ...restPayload } = event.payload;

  return {
    id: event.id,
    connector,
    type: connectType,
    title: event.title,
    customer: event.customer ?? "Unbekannt",
    priority: priorityMap[event.priority],
    createdAt: event.createdAt,
    status: event.status,
    payload: restPayload,
  };
}

/** Generischer Normalizer-Einstieg (Connect-Bridge oder bereits normalisiert). */
export function normalizeIncomingEvent(
  input: ConnectEvent | ConnectEventBridgeInput | HelpyEvent
): HelpyEvent {
  if ("category" in input && "description" in input) {
    return input;
  }

  if ("connector" in input) {
    return normalizeConnectEvent(input as ConnectEvent);
  }

  const bridge = input as ConnectEventBridgeInput;
  return normalizeConnectEvent({
    id: bridge.id,
    connector: bridge.connector as ConnectEvent["connector"],
    type: bridge.type as ConnectEvent["type"],
    title: bridge.title,
    customer: bridge.customer,
    priority: bridge.priority,
    createdAt: bridge.createdAt,
    status: bridge.status,
    payload: bridge.payload,
  });
}
