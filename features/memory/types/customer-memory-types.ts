import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type CustomerMemoryHistoryType =
  | "vorgang"
  | "angebot"
  | "rechnung"
  | "antwort"
  | "termin"
  | "besichtigung"
  | "baustelle";

export type CustomerMemoryContact = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  skill: HelpySkill;
  communicationStyle: string;
  tone: string;
  specialRequests: string[];
  notes: string[];
  createdAt: string;
  updatedAt: string;
  lastContactAt: string;
};

export type CustomerMemoryHistoryItem = {
  id: string;
  type: CustomerMemoryHistoryType;
  title: string;
  date: string;
  dateLabel: string;
  summary?: string;
  vorgangId?: string;
  status?: string;
};

export type CustomerMemoryProfile = {
  contact: CustomerMemoryContact;
  history: CustomerMemoryHistoryItem[];
  vorgangIds: string[];
};

export type MemoryEnrichmentHint = {
  id: string;
  label: string;
};

export type CustomerMemoryWorkspaceView = {
  profile: CustomerMemoryProfile | null;
  hints: MemoryEnrichmentHint[];
  panelBullets: string[];
};
