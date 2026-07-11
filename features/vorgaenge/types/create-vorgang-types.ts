import type { VorgangPriority, VorgangStatus } from "@/features/workspace/services/vorgaenge/types";

export type VorgangSource =
  | "gmail"
  | "immoscout"
  | "homegate"
  | "helpy_phone"
  | "whatsapp"
  | "manuell";

export type CreateVorgangPriority = "kritisch" | "hoch" | "normal" | "niedrig";

export type CreateVorgangStatus =
  | "neu"
  | "in_bearbeitung"
  | "warten_auf_antwort";

export type CreateVorgangInput = {
  company_id: string;
  source: VorgangSource;
  titel: string;
  inhalt: string;
  prioritaet: CreateVorgangPriority;
  status: CreateVorgangStatus;
  kunden_id?: string | null;
  objekt_id?: string | null;
  gmail_message_id?: string | null;
  gmail_thread_id?: string | null;
  voice_call_id?: string | null;
  anrufer_nummer?: string | null;
  termin_datum?: string | null;
  termin_uhrzeit?: string | null;
  whatsapp_message_id?: string | null;
};

export type VorgangDbRecord = {
  id: string;
  company_id: string;
  source: VorgangSource;
  titel: string;
  inhalt: string;
  prioritaet: string;
  status: string;
  kunden_id: string | null;
  objekt_id: string | null;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  voice_call_id: string | null;
  anrufer_nummer: string | null;
  termin_datum: string | null;
  termin_uhrzeit: string | null;
  whatsapp_message_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateVorgangResult = {
  id: string;
  record: VorgangDbRecord;
  created: boolean;
};

export function mapCreatePriorityToVorgang(
  priority: CreateVorgangPriority
): VorgangPriority {
  if (priority === "normal") return "mittel";
  return priority;
}

export function mapCreateStatusToVorgang(
  status: CreateVorgangStatus
): VorgangStatus {
  if (status === "warten_auf_antwort") return "wartend";
  return status;
}

export function mapVorgangPriorityToCreate(
  priority: VorgangPriority
): CreateVorgangPriority {
  if (priority === "mittel") return "normal";
  return priority;
}

export const VORGANG_SOURCE_LABELS: Record<VorgangSource, string> = {
  gmail: "Gmail",
  immoscout: "ImmoScout24",
  homegate: "Homegate",
  helpy_phone: "HELPY Phone",
  whatsapp: "WhatsApp",
  manuell: "Manuell",
};

export function resolveMailSourceFromQuelle(quelle: string): VorgangSource {
  const normalized = quelle.toLowerCase();
  if (normalized.includes("immoscout")) return "immoscout";
  if (normalized.includes("homegate")) return "homegate";
  return "gmail";
}
