import type {
  HelpyEvent,
  HelpyEventCategory,
  HelpyEventSource,
  HelpyEventType,
} from "@/features/events/types/event-types";
import { createHelpyEventId } from "@/features/events/utils/event-id";

const MOCK_DATE = "2026-07-07T08:00:00+02:00";

type MockSpec = {
  source: HelpyEventSource;
  category: HelpyEventCategory;
  type: HelpyEventType;
  title: string;
  customer: string;
  priority: HelpyEvent["priority"];
  payload?: HelpyEvent["payload"];
};

const MOCK_SPECS: MockSpec[] = [
  {
    source: "gmail",
    category: "mail",
    type: "MailReceived",
    title: "Angebotsanfrage Büroausstattung",
    customer: "Thomas Müller · Weber & Co.",
    priority: "hoch",
    payload: { threadId: "thread-weber-001" },
  },
  {
    source: "gmail",
    category: "document",
    type: "AttachmentFound",
    title: "PDF-Anhang: Leistungsverzeichnis",
    customer: "Logistik Huber GmbH",
    priority: "mittel",
  },
  {
    source: "immoscout24",
    category: "lead",
    type: "LeadReceived",
    title: "Anfrage 4.5-Zi-Wohnung Zürich",
    customer: "Familie Schneider",
    priority: "hoch",
  },
  {
    source: "immoscout24",
    category: "lead",
    type: "VisitRequested",
    title: "Besichtigung Wohnung Seefeld",
    customer: "Marc Keller",
    priority: "hoch",
  },
  {
    source: "homepage",
    category: "form",
    type: "FormSubmitted",
    title: "Kontaktformular: Sanierungsanfrage",
    customer: "Renovierung AG",
    priority: "mittel",
  },
  {
    source: "homepage",
    category: "lead",
    type: "LeadCreated",
    title: "Offertanfrage Dachsanierung",
    customer: "Bauwerk Müller",
    priority: "hoch",
  },
  {
    source: "calendar",
    category: "calendar",
    type: "AppointmentCreated",
    title: "Besichtigung Musterstraße 12",
    customer: "Intern",
    priority: "mittel",
  },
  {
    source: "calendar",
    category: "calendar",
    type: "AppointmentChanged",
    title: "Termin verschoben: Weber Besprechung",
    customer: "Weber & Co.",
    priority: "mittel",
  },
  {
    source: "whatsapp",
    category: "message",
    type: "MessageReceived",
    title: "Rückfrage zu Offerte #A-2026-0147",
    customer: "Sandra Meier",
    priority: "hoch",
  },
];

function specToEvent(spec: MockSpec, index: number): HelpyEvent {
  const id = createHelpyEventId("mock");
  return {
    id,
    source: spec.source,
    category: spec.category,
    type: spec.type,
    title: spec.title,
    description: `${spec.type} — ${spec.customer}: ${spec.title}`,
    createdAt: `${MOCK_DATE.slice(0, 11)}${String(8 + index).padStart(2, "0")}:15:00+02:00`,
    payload: spec.payload ?? {},
    priority: spec.priority,
    status: "neu",
    customer: spec.customer,
  };
}

export const MOCK_HELPY_EVENTS: HelpyEvent[] = MOCK_SPECS.map(specToEvent);

export function getMockHelpyEventsBySource(
  source: HelpyEventSource
): HelpyEvent[] {
  return MOCK_HELPY_EVENTS.filter((e) => e.source === source);
}
