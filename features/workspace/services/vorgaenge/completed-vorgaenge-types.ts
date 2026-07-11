import type { MailProvider } from "@/lib/database/types";

export type CompletedVorgangStatus =
  | "Neu"
  | "Von HELPY vorbereitet"
  | "Warten auf Prüfung"
  | "Warten auf Antwort"
  | "Erledigt"
  | "Neue Antwort eingegangen";

export type CompletedVorgangRecord = {
  id?: string;
  companyId: string;
  /** @deprecated Alias — UI workspace / Vorgang-Id */
  workspaceId: string;
  provider: MailProvider;
  providerThreadId: string | null;
  providerMessageId: string | null;
  caseId: string;
  vorgangId: string;
  /** @deprecated Alias für providerThreadId */
  gmailThreadId: string | null;
  gmailMessageIds: string[];
  status: CompletedVorgangStatus;
  completedAt: string;
  completedBy: string | null;
  /** @deprecated Alias für completedBy */
  completedByUserId: string | null;
  lastKnownIncomingMessageAt: string | null;
  lastKnownOutgoingMessageAt: string | null;
  /** @deprecated Prefer lastKnownIncomingMessageAt */
  latestMessageAt: string;
  updatedAt: string;
};

export function toDbStatus(status: CompletedVorgangStatus): string {
  switch (status) {
    case "Neu":
      return "neu";
    case "Von HELPY vorbereitet":
      return "von_helpy_vorbereitet";
    case "Warten auf Prüfung":
      return "warten_auf_pruefung";
    case "Warten auf Antwort":
      return "warten_auf_antwort";
    case "Neue Antwort eingegangen":
      return "neue_antwort_eingegangen";
    case "Erledigt":
    default:
      return "erledigt";
  }
}

export function fromDbStatus(status: string | null | undefined): CompletedVorgangStatus {
  switch ((status ?? "").toLowerCase()) {
    case "neu":
      return "Neu";
    case "von_helpy_vorbereitet":
    case "von helpy vorbereitet":
      return "Von HELPY vorbereitet";
    case "warten_auf_pruefung":
    case "warten auf prüfung":
      return "Warten auf Prüfung";
    case "warten_auf_antwort":
    case "warten auf antwort":
      return "Warten auf Antwort";
    case "neue_antwort_eingegangen":
    case "neue antwort eingegangen":
      return "Neue Antwort eingegangen";
    case "erledigt":
    default:
      return "Erledigt";
  }
}
