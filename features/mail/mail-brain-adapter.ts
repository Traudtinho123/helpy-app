import { analyzeGmailMessage } from "@/features/brain/services/brain-v3";
import type { BrainV3AnalysisInput, BrainV3Result } from "@/features/brain/types/brain-v3-types";
import {
  buildGmailVorgangBundle,
  type GmailVorgangBundle,
} from "@/features/brain/services/brain-result-to-vorgang";
import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import { normalizeMailTimestampToIso } from "@/features/mail/services/mail-received-at";
import { mapUnifiedMailToGmailConnector } from "@/features/mail/services/unified-mail-mapper";
import { mergeThreadAttachments } from "@/features/mail/services/mail-attachment-mapper";
import { resolveMailProviderFromVorgang } from "@/features/mail/services/mail-provider-registry";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { DEFAULT_HELPY_SKILL } from "@/features/workspace/services/workspace/skills";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";

function resolveActiveSkill(explicit?: HelpySkill): HelpySkill {
  if (explicit) return explicit;
  try {
    return getCompanyProfileSnapshot().activePaidSkill ?? DEFAULT_HELPY_SKILL;
  } catch {
    return DEFAULT_HELPY_SKILL;
  }
}

export function analyzeUnifiedMailMessage(
  message: UnifiedMailMessage,
  activeSkill?: HelpySkill
): BrainV3Result {
  const input: BrainV3AnalysisInput = {
    id: message.providerMessageId,
    threadId: message.providerThreadId,
    subject: message.subject,
    from: message.from,
    snippet: message.snippet,
    date: message.receivedAt,
  };

  const result = analyzeGmailMessage(input, {
    activeSkill: resolveActiveSkill(activeSkill),
  });

  if (message.provider === "outlook") {
    return {
      ...result,
      id: `brain-v3-outlook-${message.providerMessageId}`,
      source: "outlook",
    };
  }

  return result;
}

export function analyzeUnifiedMailMessages(
  messages: UnifiedMailMessage[],
  activeSkill?: HelpySkill
): BrainV3Result[] {
  return messages.map((message) =>
    analyzeUnifiedMailMessage(message, activeSkill)
  );
}

export function buildMailVorgangBundles(
  results: BrainV3Result[],
  messages: UnifiedMailMessage[]
): GmailVorgangBundle[] {
  const byId = new Map(
    messages.map((message) => [message.providerMessageId, message])
  );

  return results.flatMap((result) => {
    const unified = byId.get(result.originalEmailId);
    if (!unified) return [];

    const connectorMessage = mapUnifiedMailToGmailConnector(unified);
    const bundle = buildGmailVorgangBundle(result, connectorMessage);
    const liste: ListeVorgang = {
      ...bundle.liste,
      quelle: unified.provider === "outlook" ? "Outlook" : "Gmail",
      mailProvider: unified.provider,
      mailConnectionId: unified.connectionId,
      mailAttachments: unified.attachments.length ? unified.attachments : undefined,
      latestMessageDirection: unified.direction,
      latestMessageFrom: unified.from,
      latestMessageAt: unified.receivedAt,
      emailDate: unified.receivedAt,
      receivedAt:
        normalizeMailTimestampToIso(unified.receivedAt) ?? bundle.liste.receivedAt,
      hasUnreadExternalMessage:
        unified.isUnread && unified.direction === "incoming",
    };

    return [{ ...bundle, liste }];
  });
}

export { resolveMailProviderFromVorgang };
