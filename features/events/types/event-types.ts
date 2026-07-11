/** Plattform-Quelle — wer das Event erzeugt hat. */
export type HelpyEventSource =
  | "gmail"
  | "outlook"
  | "immoscout24"
  | "homegate"
  | "newhome"
  | "homepage"
  | "whatsapp"
  | "calendar"
  | "facebook"
  | "connect";

/** Fachliche Kategorie für Routing und Brain. */
export type HelpyEventCategory =
  | "mail"
  | "calendar"
  | "lead"
  | "form"
  | "message"
  | "document"
  | "deadline";

/** Kanonische Event-Typen (Integration → Event Bus). */
export type HelpyEventType =
  // Gmail
  | "MailReceived"
  | "MailUpdated"
  | "AttachmentFound"
  // ImmoScout24
  | "LeadReceived"
  | "VisitRequested"
  | "ObjectMatched"
  // Homepage / Formulare
  | "FormSubmitted"
  | "LeadCreated"
  // Kalender
  | "AppointmentCreated"
  | "AppointmentChanged"
  | "AppointmentCancelled"
  // WhatsApp
  | "MessageReceived";

export type HelpyEventPriority = "kritisch" | "hoch" | "mittel" | "niedrig";

export type HelpyEventStatus =
  | "neu"
  | "in-verarbeitung"
  | "verarbeitet"
  | "archiviert";

export type HelpyEventPayload = Record<
  string,
  string | number | boolean | undefined
>;

/**
 * Einheitliches HELPY-Ereignis — einzige Eingabe für Brain und Router.
 * Plattformen liefern Rohdaten; der Normalizer erzeugt HelpyEvent.
 */
export type HelpyEvent = {
  id: string;
  source: HelpyEventSource;
  category: HelpyEventCategory;
  type: HelpyEventType;
  title: string;
  description: string;
  createdAt: string;
  payload: HelpyEventPayload;
  priority: HelpyEventPriority;
  status: HelpyEventStatus;
  /** Anzeigename Kunde/Absender — aus Normalizer */
  customer?: string;
};

/** Roh-Input von Connect-Schicht (Legacy-Bridge, v1). */
export type ConnectEventBridgeInput = {
  id: string;
  connector: string;
  type: string;
  title: string;
  customer: string;
  priority: "hoch" | "mittel" | "niedrig";
  createdAt: string;
  status: HelpyEventStatus;
  payload: HelpyEventPayload;
};

export type HelpyEventSubscriber = (event: HelpyEvent) => void;

export type EventBusPublishResult = {
  event: HelpyEvent;
  duplicate: boolean;
};
