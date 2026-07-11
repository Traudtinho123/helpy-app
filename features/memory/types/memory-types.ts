export type ObjectMemoryRecord = {
  objectId: string;
  frequentQuestions: string[];
  desiredFeatures: string[];
  inquiryIntensity: string | null;
  typicalViewingTimes: string[];
  commonObjections: string[];
  importantDocuments: string[];
  openPoints: string[];
  insights: string[];
  lastUpdated: string;
};

export type MemoryEntityType = "customer" | "object" | "company";

export type MemoryCategory =
  | "kontaktpraeferenz"
  | "terminpraeferenz"
  | "budget"
  | "objektwunsch"
  | "einwand"
  | "persoenliche-info"
  | "wiederkehrende-frage"
  | "frist"
  | "entscheidung"
  | "kommunikationsstil"
  | "firmenablauf"
  | "objekt-erkenntnis";

export type BackgroundMemoryEntry = {
  id: string;
  entityType: MemoryEntityType;
  entityId: string;
  memoryType: MemoryCategory;
  value: string;
  normalizedValue: string;
  displayText: string;
  tip?: string;
  source: string;
  createdAt: string;
};

export type BackgroundMemoryHint = {
  id: string;
  rememberText: string;
  tipText?: string;
  relevance: number;
};

export type BackgroundMemoryWorkspaceContext = {
  vorgangId: string;
  customerEmail?: string | null;
  customerName?: string | null;
  objectId?: string | null;
  hasAppointmentFlow?: boolean;
  hasReplyDraft?: boolean;
};

export type BackgroundMemoryEvent =
  | {
      type: "mail-analysiert";
      vorgangId: string;
      email: string;
      text: string;
      objectId?: string | null;
    }
  | {
      type: "antwort-gesendet";
      vorgangId: string;
      email: string;
      text?: string;
      objectId?: string | null;
    }
  | {
      type: "termin-bestaetigt";
      vorgangId: string;
      email: string;
      slotLabel: string;
      text?: string;
      objectId?: string | null;
    }
  | {
      type: "dokument-erkannt";
      vorgangId: string;
      email?: string | null;
      text: string;
      objectId?: string | null;
      category?: string | null;
    }
  | {
      type: "kundenakte-bestaetigt";
      kundenakte: import("@/features/kundenakte/types/kundenakte-types").Kundenakte;
    }
  | {
      type: "objekt-erkannt";
      objectId: string;
      text: string;
      vorgangId?: string;
    }
  | {
      type: "vorgang-erledigt";
      vorgangId: string;
      email?: string | null;
      text?: string;
      objectId?: string | null;
    };
