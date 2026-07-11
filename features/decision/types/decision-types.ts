import type { BrainV3Result } from "@/features/brain/types/brain-v3-types";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import type { MemoryEntry } from "@/features/memory/services/types";
import type { WorkflowTemplate } from "@/features/workflow/services/automation/workflow-types";
import type { VorgangPriority } from "@/features/workspace/services/vorgaenge/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type HelpyDecision = {
  id: string;
  vorgangId: string;
  decisionTitle: string;
  reason: string;
  nextBestStep: string;
  preparedItems: string[];
  needsConfirmation: true;
  confirmationLabel: string;
  helpyMessage: string;
};

export type DecisionGmailData = {
  subject: string;
  from: string;
  snippet?: string;
  threadId?: string;
  date?: string;
};

export type DecisionInput = {
  vorgangId: string;
  skill?: HelpySkill;
  skillLabel?: string;
  intent?: string;
  intentLabel?: string;
  priority: VorgangPriority;
  summary?: string;
  recommendedAction?: string;
  brainResult?: BrainV3Result;
  gmail?: DecisionGmailData;
  memoryEntries?: MemoryEntry[];
  workflowTemplate?: WorkflowTemplate;
};

export type DecisionContext = DecisionInput & {
  recognized: string[];
  kunde: string;
  workflowName?: string;
  companyKnowledgeHint?: string | null;
};

export type DecisionRuleOutcome = {
  decisionTitle: string;
  reason: string;
  nextBestStep: string;
  preparedItems: string[];
  confirmationItems: string[];
  helpyMessage: string;
};

export type DecisionEvaluation = {
  context: DecisionContext;
  decision: HelpyDecision;
};

export type DecisionBundleInput = {
  brain: BrainV3Result;
  message: GmailConnectorMessage;
};
