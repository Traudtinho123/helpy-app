import {
  analyzeUnifiedMailMessages,
  buildMailVorgangBundles,
} from "@/features/mail/mail-brain-adapter";
import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import { buildArchiveVorgangBundle } from "@/features/mail/services/archive-vorgang-builder";
import { classifyMailsForVorgangClient } from "@/features/mail/services/mail-vorgang-classifier";
import {
  applyClassificationGate,
  evaluateInstantArchiveFilter,
  evaluateMailIntake,
} from "@/features/mail/services/mail-intake-gate";
import { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import { isHelpySystemUnifiedMail } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import { buildHelpyReportBundle } from "@/features/workspace/services/vorgaenge/helpy-report-vorgang";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import {
  isArchiveMailCategory,
  mapMailCategoryToArchiveCategory,
  type VorgangMailCategory,
} from "@/features/mail/services/vorgang-classification-types";

export type MailVorgangBuildResult = {
  /** Echte Kunden-Vorgänge — benötigen Reaktion. */
  customerBundles: GmailVorgangBundle[];
  /** Automatisch aussortierte Spam/Newsletter/System-Mails. */
  archiveBundles: GmailVorgangBundle[];
  processedMessageIds: string[];
};

function toIntakeInput(message: UnifiedMailMessage) {
  return {
    from: message.from,
    subject: message.subject,
    snippet: message.snippet,
    bodyPreview: message.bodyPreview,
    replyTo: message.replyTo,
    listUnsubscribe: message.listUnsubscribe,
    precedence: message.precedence,
    xMailer: message.xMailer,
    sourceAccountEmail: message.sourceAccountEmail,
    direction: message.direction,
  };
}

/**
 * Mail-Intake mit zwei Bereichen:
 * 1) Sofort-Filter → zu_archivieren
 * 2) KI-Klassifikation → echter Vorgang oder Archiv
 */
export async function buildAllMailVorgangBundles(
  messages: UnifiedMailMessage[],
  activeSkill?: HelpySkill
): Promise<MailVorgangBuildResult> {
  const customerBundles: GmailVorgangBundle[] = [];
  const archiveBundles: GmailVorgangBundle[] = [];
  const processedMessageIds: string[] = [];
  const classifyCandidates: UnifiedMailMessage[] = [];

  for (const message of messages) {
    processedMessageIds.push(message.providerMessageId);

    if (isHelpySystemUnifiedMail(message)) {
      customerBundles.push(buildHelpyReportBundle(message));
      continue;
    }

    const instant = evaluateInstantArchiveFilter(toIntakeInput(message));
    if (instant?.shouldArchive) {
      archiveBundles.push(
        buildArchiveVorgangBundle({
          message,
          reason: instant.reason,
          archiveCategory: instant.archiveCategory ?? "spam",
        })
      );
      continue;
    }

    classifyCandidates.push(message);
  }

  if (classifyCandidates.length === 0) {
    return { customerBundles, archiveBundles, processedMessageIds };
  }

  const classificationInputs = classifyCandidates.map((message) => ({
    messageId: message.providerMessageId,
    from: message.from,
    subject: message.subject,
    bodyPreview: message.bodyPreview || message.snippet,
  }));

  const classifications = await classifyMailsForVorgangClient(classificationInputs);
  const vorgangCandidates: UnifiedMailMessage[] = [];

  for (const message of classifyCandidates) {
    const baseDecision = evaluateMailIntake(toIntakeInput(message));
    const classification =
      classifications.get(message.providerMessageId) ?? null;
    const finalDecision = applyClassificationGate(baseDecision, classification);

    if (finalDecision.shouldArchive) {
      const mailCategory = classification?.kategorie as VorgangMailCategory | undefined;
      archiveBundles.push(
        buildArchiveVorgangBundle({
          message,
          reason: finalDecision.reason,
          mailCategory,
          archiveCategory: finalDecision.archiveCategory ?? undefined,
        })
      );
      continue;
    }

    if (finalDecision.shouldCreateVorgang) {
      vorgangCandidates.push(message);
    }
  }

  if (vorgangCandidates.length > 0) {
    const results = analyzeUnifiedMailMessages(vorgangCandidates, activeSkill);
    customerBundles.push(...buildMailVorgangBundles(results, vorgangCandidates));
  }

  return { customerBundles, archiveBundles, processedMessageIds };
}

/** @deprecated Nutze customerBundles aus MailVorgangBuildResult */
export function extractCustomerBundles(bundles: GmailVorgangBundle[]): GmailVorgangBundle[] {
  return bundles.filter((bundle) => !isHelpyReportVorgang(bundle.liste));
}

export { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
