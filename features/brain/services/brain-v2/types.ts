import type { ConnectEvent, ConnectorId } from "@/features/platforms/services/connect/connector-types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type BrainIntent =
  | "angebotsanfrage"
  | "immobilienanfrage"
  | "besichtigung"
  | "rueckruf"
  | "terminwunsch"
  | "frist"
  | "rechnung"
  | "dokument"
  | "mandatsanfrage"
  | "offertanfrage"
  | "normale_nachricht";

export type BrainPriority = "kritisch" | "hoch" | "mittel" | "niedrig";

export type CustomerMatchType =
  | "bestandskunde"
  | "neuer_kunde"
  | "unbekannt";

export type PreparedAction =
  | "Kunde anlegen"
  | "Angebot vorbereiten"
  | "Besichtigung planen"
  | "Rückruf planen"
  | "Frist sichern"
  | "Dokument prüfen"
  | "Antwort vorbereiten"
  | "Workspace öffnen";

export type CreatedObject =
  | "Vorgang vorbereitet"
  | "Kunde vorbereitet"
  | "Aufgabe vorbereitet"
  | "Termin vorbereitet"
  | "Dokument vorbereitet";

export type PreparedWorkItemStatus =
  | "vorbereitet"
  | "neu"
  | "in_bearbeitung"
  | "erledigt";

export type CustomerMatch = {
  type: CustomerMatchType;
  customerId?: string;
  customerName: string;
  companyName?: string;
};

export type PreparedWorkItem = {
  id: string;
  sourceEventId: string;
  title: string;
  customerName: string;
  sourcePlatform: string;
  sourceConnectorId: ConnectorId;
  skill: HelpySkill;
  intent: BrainIntent;
  priority: BrainPriority;
  status: PreparedWorkItemStatus;
  summary: string;
  detectedContext: string[];
  recommendedNextStep: string;
  preparedActions: PreparedAction[];
  helpyMessage: string;
  createdObjects: CreatedObject[];
  receivedAt: string;
  receivedLabel: string;
  href?: string;
  kundenAkteId?: string;
};

export type BrainV2Result = {
  items: PreparedWorkItem[];
  summary: BrainV2Summary;
  processedAt: string;
};

export type BrainV2Summary = {
  total: number;
  kritisch: number;
  hoch: number;
  mittel: number;
  niedrig: number;
  neueKunden: number;
  vorbereiteteAngebote: number;
  introMessage: string;
  priorityHint: string;
};

export type IntentDetectionInput = ConnectEvent;

export type PriorityDetectionInput = {
  event: ConnectEvent;
  intent: BrainIntent;
  customerMatch: CustomerMatch;
};

export type ContextBuildInput = {
  event: ConnectEvent;
  intent: BrainIntent;
  customerMatch: CustomerMatch;
};

export type RecommendationInput = {
  event: ConnectEvent;
  intent: BrainIntent;
  priority: BrainPriority;
  customerMatch: CustomerMatch;
  context: string[];
};

export const BRAIN_INTENT_LABELS: Record<BrainIntent, string> = {
  angebotsanfrage: "Angebotsanfrage",
  immobilienanfrage: "Immobilienanfrage",
  besichtigung: "Besichtigung",
  rueckruf: "Rückruf",
  terminwunsch: "Terminwunsch",
  frist: "Frist",
  rechnung: "Rechnung",
  dokument: "Dokument",
  mandatsanfrage: "Mandatsanfrage",
  offertanfrage: "Offertanfrage",
  normale_nachricht: "Normale Nachricht",
};

export const BRAIN_PRIORITY_LABELS: Record<BrainPriority, string> = {
  kritisch: "Kritisch",
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

export const CUSTOMER_MATCH_LABELS: Record<CustomerMatchType, string> = {
  bestandskunde: "Bestandskunde",
  neuer_kunde: "Neuer Kunde",
  unbekannt: "Unbekannter Absender",
};

export const BRAIN_V2_PANEL = {
  intro:
    "Ich habe deine Eingänge verstanden und Vorgänge vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.",
  priorityHint:
    "Heute würde ich zuerst die kritischen und hochwertigen Anfragen prüfen.",
} as const;
