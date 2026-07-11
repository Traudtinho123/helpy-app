import type { WhatsappMessageStatusDb } from "@/lib/database/types";

export type WhatsappMessageStatus = WhatsappMessageStatusDb;

export type WhatsappMessage = {
  id: string;
  companyId: string;
  messageId: string;
  fromNumber: string;
  fromName: string | null;
  body: string;
  messageType: string;
  status: WhatsappMessageStatus;
  intentType: string | null;
  intentLabel: string | null;
  priority: string | null;
  summary: string | null;
  recommendedAction: string | null;
  customerId: string | null;
  customerName: string | null;
  receivedAt: string;
  classifiedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type WhatsappConnection = {
  id: string;
  companyId: string;
  phoneNumberId: string;
  displayNumber: string | null;
  wabaId: string | null;
  isActive: boolean;
  connectedAt: string;
};

export type WhatsappSummary = {
  openCount: number;
  neuCount: number;
  inBearbeitungCount: number;
  erledigtCount: number;
  archiviertCount: number;
  todayCount: number;
  weekCount: number;
  connected: boolean;
  displayNumber: string | null;
};

export type WhatsappMessageFilter = "alle" | WhatsappMessageStatus;

export const WHATSAPP_FILTER_LABELS: Record<WhatsappMessageFilter, string> = {
  alle: "Alle",
  neu: "Neu",
  in_bearbeitung: "In Bearbeitung",
  erledigt: "Erledigt",
  archiviert: "Archiviert",
};

export const WHATSAPP_BRAND_COLOR = "#25D366";
