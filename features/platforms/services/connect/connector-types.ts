import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type ConnectorId =
  | "gmail"
  | "outlook"
  | "immoscout24-ch"
  | "homegate"
  | "newhome"
  | "website"
  | "kontaktformulare"
  | "whatsapp-business"
  | "google-calendar"
  | "microsoft-calendar"
  | "facebook-leads";

export type ConnectorStatus =
  | "connected"
  | "disconnected"
  | "syncing"
  | "error"
  | "available";

export type ConnectEventType =
  | "neue-email"
  | "neue-immobilienanfrage"
  | "neue-offertanfrage"
  | "neues-kontaktformular"
  | "neuer-kalendereintrag"
  | "neue-whatsapp-nachricht"
  | "neue-facebook-lead"
  | "neue-datei"
  | "terminaenderung"
  | "frist-erkannt";

export type ConnectEventPriority = "hoch" | "mittel" | "niedrig";

export type ConnectEventStatus = "neu" | "in-verarbeitung" | "verarbeitet" | "archiviert";

export type ConnectorRecord = {
  id: ConnectorId;
  name: string;
  icon: string;
  status: ConnectorStatus;
  skill: HelpySkill | "all";
  connected: boolean;
  lastSync: string | null;
  eventCount: number;
};

export type ConnectEventPayload = Record<string, string | number | boolean | undefined>;

export type ConnectEvent = {
  id: string;
  connector: ConnectorId;
  type: ConnectEventType;
  title: string;
  customer: string;
  priority: ConnectEventPriority;
  createdAt: string;
  status: ConnectEventStatus;
  payload: ConnectEventPayload;
};

export type ConnectSyncResult = {
  connectorId: ConnectorId;
  syncedAt: string;
  newEvents: number;
  success: boolean;
  errorMessage?: string;
};

export type BrainQueueItemResult = {
  eventId: string;
  connector: ConnectorId;
  type: ConnectEventType;
  title: string;
  priority: ConnectEventPriority;
  helpyMessage: string;
  suggestedAction: string;
  vorgangKategorie?: string;
  processedAt: string;
};

export type BrainQueueProcessingResult = {
  processedCount: number;
  results: BrainQueueItemResult[];
  queueRemaining: number;
  summary: string;
};

export type ConnectEngineSnapshot = {
  connectors: ConnectorRecord[];
  queue: ConnectEvent[];
  pendingCount: number;
  processedToday: number;
};
