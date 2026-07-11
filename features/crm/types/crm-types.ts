import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type CrmCustomerStatus = "neu" | "bestandskunde";

export type CrmTimelineType =
  | "vorgang"
  | "angebot"
  | "rechnung"
  | "antwort"
  | "termin"
  | "besichtigung"
  | "baustelle"
  | "dokument"
  | "projekt";

export type CrmTimelineEntry = {
  id: string;
  type: CrmTimelineType;
  title: string;
  date: string;
  dateLabel: string;
  summary?: string;
  vorgangId?: string;
  status?: string;
};

export type CrmProject = {
  id: string;
  title: string;
  status: string;
  startedAt: string;
  vorgangId?: string;
};

export type CrmDocument = {
  id: string;
  title: string;
  type: string;
  date: string;
  vorgangId?: string;
};

export type HelpyCrmCustomer = {
  id: string;
  ansprechpartner: string;
  firma: string;
  email: string;
  telefon: string;
  adresse: string;
  branche: string;
  skill: HelpySkill;
  status: CrmCustomerStatus;
  notes: string[];
  projects: CrmProject[];
  offers: CrmTimelineEntry[];
  invoices: CrmTimelineEntry[];
  appointments: CrmTimelineEntry[];
  documents: CrmDocument[];
  timeline: CrmTimelineEntry[];
  vorgangIds: string[];
  createdAt: string;
  updatedAt: string;
  lastContactAt: string;
};

export type CrmMatchInput = {
  email?: string;
  telefon?: string;
  firma?: string;
  ansprechpartner?: string;
};

export type CrmWorkspaceView = {
  customer: HelpyCrmCustomer | null;
  isNewCustomer: boolean;
};
