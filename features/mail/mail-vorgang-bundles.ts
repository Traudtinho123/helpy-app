import {
  analyzeUnifiedMailMessages,
  buildMailVorgangBundles,
} from "@/features/mail/mail-brain-adapter";
import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import { classifyMailsForVorgangClient } from "@/features/mail/services/mail-vorgang-classifier";
import {
  applyClassificationGate,
  evaluateMailIntake,
} from "@/features/mail/services/mail-intake-gate";
import { isHelpySystemUnifiedMail } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import {
  buildHelpyReportBundle,
  buildSystemMailReportBundle,
} from "@/features/workspace/services/vorgaenge/helpy-report-vorgang";
import type { SystemMailCategory } from "@/features/mail/services/system-mail-detector";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

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

function resolveReportCategory(
  category: SystemMailCategory | undefined
): "verification" | "system_transaction" | "newsletter" | "own_sent" {
  if (
    category === "verification" ||
    category === "newsletter" ||
    category === "own_sent"
  ) {
    return category;
  }
  return "system_transaction";
}

function toSystemReportBundle(
  message: UnifiedMailMessage,
  reason: string,
  category?: SystemMailCategory
): GmailVorgangBundle {
  return buildSystemMailReportBundle(message, {
    isSystemMail: true,
    category: resolveReportCategory(category),
    reason,
  });
}

/**
 * Striktes Mail-Intake: Standard ist KEIN Kunden-Vorgang.
 * Nur explizit bestätigte Kundenanfragen werden analysiert.
 */
export async function buildAllMailVorgangBundles(
  messages: UnifiedMailMessage[],
  activeSkill?: HelpySkill
): Promise<GmailVorgangBundle[]> {
  const reportBundles: GmailVorgangBundle[] = [];
  const gatePassed: UnifiedMailMessage[] = [];

  for (const message of messages) {
    if (isHelpySystemUnifiedMail(message)) {
      reportBundles.push(buildHelpyReportBundle(message));
      continue;
    }

    const intake = evaluateMailIntake(toIntakeInput(message));
    if (!intake.shouldCreateVorgang) {
      if (intake.systemMail?.category === "own_sent") {
        continue;
      }
      reportBundles.push(
        toSystemReportBundle(
          message,
          intake.reason,
          intake.systemMail?.category ?? "system_transaction"
        )
      );
      continue;
    }

    gatePassed.push(message);
  }

  if (gatePassed.length === 0) {
    return reportBundles;
  }

  const classificationInputs = gatePassed.map((message) => ({
    messageId: message.providerMessageId,
    from: message.from,
    subject: message.subject,
    bodyPreview: message.bodyPreview || message.snippet,
  }));

  const classifications = await classifyMailsForVorgangClient(classificationInputs);
  const vorgangCandidates: UnifiedMailMessage[] = [];

  for (const message of gatePassed) {
    const baseDecision = evaluateMailIntake(toIntakeInput(message));
    const classification =
      classifications.get(message.providerMessageId) ?? null;
    const finalDecision = applyClassificationGate(baseDecision, classification);

    if (finalDecision.shouldCreateVorgang) {
      vorgangCandidates.push(message);
      continue;
    }

    reportBundles.push(
      toSystemReportBundle(
        message,
        finalDecision.reason,
        finalDecision.systemMail?.category ?? "system_transaction"
      )
    );
  }

  if (vorgangCandidates.length === 0) {
    return reportBundles;
  }

  const results = analyzeUnifiedMailMessages(vorgangCandidates, activeSkill);
  const customerBundles = buildMailVorgangBundles(results, vorgangCandidates);

  return [...reportBundles, ...customerBundles];
}

export { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
