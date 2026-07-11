import type { BrainV3Result } from "@/features/brain/types/brain-v3-types";
import type { HelpyDecision } from "@/features/decision/types/decision-types";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import type { VorgangPriority } from "@/features/workspace/services/vorgaenge/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type ReplyDraftStatus =
  | "vorbereitet"
  | "bearbeitet"
  | "bestaetigt"
  | "uebernommen";

export type ReplyDraft = {
  id: string;
  vorgangId: string;
  /** Anzeige für Prüf-Dialog, z. B. "Name <email@domain.com>" */
  recipient: string;
  /** Extrahierte Zieladresse für Gmail-Versand */
  recipientEmail: string | null;
  /** Original-From-Header der geöffneten Gmail-Nachricht */
  originalFrom: string;
  recipientValid: boolean;
  subject: string;
  tone: string;
  draftText: string;
  missingInfo: string[];
  suggestedAttachments: string[];
  needsConfirmation: true;
  status: ReplyDraftStatus;
};

export type ReplyDraftInput = {
  vorgangId: string;
  skill?: HelpySkill;
  skillLabel?: string;
  intent?: string;
  intentLabel?: string;
  priority: VorgangPriority;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet?: string;
  brainResult?: BrainV3Result;
  decision?: HelpyDecision;
  memoryHints?: string[];
  gmailMessage?: Pick<GmailConnectorMessage, "subject" | "from" | "snippet">;
  /** Original-From-Header — immer aus der geöffneten Gmail-Nachricht */
  originalFrom?: string;
};

export type ReplyTemplateOutcome = {
  tone: string;
  subject: string;
  draftText: string;
  missingInfo: string[];
  suggestedAttachments: string[];
};

export type ReplyDraftEvaluation = {
  input: ReplyDraftInput;
  draft: ReplyDraft;
};
