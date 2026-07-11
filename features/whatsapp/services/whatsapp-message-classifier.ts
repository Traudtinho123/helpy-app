import { analyzeGmailMessage } from "@/features/brain/services/brain-v3";
import type { BrainV3AnalysisInput } from "@/features/brain/types/brain-v3-types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type WhatsappClassification = {
  intentType: string;
  intentLabel: string;
  priority: string;
  summary: string;
  recommendedAction: string;
};

function formatWhatsappSender(fromNumber: string, fromName?: string | null): string {
  if (fromName?.trim()) {
    return `${fromName.trim()} <+${fromNumber.replace(/\D/g, "")}>`;
  }
  return `+${fromNumber.replace(/\D/g, "")}`;
}

export function classifyWhatsappMessage(input: {
  messageId: string;
  fromNumber: string;
  fromName?: string | null;
  body: string;
  receivedAt: string;
  activeSkill?: HelpySkill;
}): WhatsappClassification {
  const snippet = input.body.trim() || "WhatsApp-Nachricht ohne Textinhalt";
  const brainInput: BrainV3AnalysisInput = {
    id: input.messageId,
    threadId: `wa-${input.fromNumber}`,
    subject: "WhatsApp-Nachricht",
    from: formatWhatsappSender(input.fromNumber, input.fromName),
    snippet,
    date: input.receivedAt,
  };

  const result = analyzeGmailMessage(brainInput, {
    activeSkill: input.activeSkill,
  });

  return {
    intentType: result.intent,
    intentLabel: result.intent,
    priority: result.priority,
    summary: result.summary,
    recommendedAction: result.recommendedAction,
  };
}
