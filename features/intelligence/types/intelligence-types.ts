/** Strukturiertes Kundenwissen pro Interessent/Kunde. */

export type CustomerPreferredContact = "E-Mail" | "Telefon" | "WhatsApp";

export type CustomerMemory = {
  customerId: string;
  memorySummary: string;
  preferences: string[];
  budget: string | null;
  communicationStyle: string | null;
  preferredContact: CustomerPreferredContact | null;
  importantFacts: string[];
  lastUpdated: string;
};

export type CustomerMemoryUpdateSource =
  | "email"
  | "termin"
  | "kundenakte"
  | "angebot";

export type CustomerMemoryUpdateInput = {
  customerId: string;
  source: CustomerMemoryUpdateSource;
  text: string;
  vorgangId?: string;
};

export type CustomerMemoryUpdateResult = {
  updated: boolean;
  memory: CustomerMemory;
  newFacts: string[];
};

export type IntelligencePanelView = {
  bullets: string[];
  memorySummary: string | null;
};
