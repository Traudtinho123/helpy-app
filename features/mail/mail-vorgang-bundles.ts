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
import { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import { isHelpySystemUnifiedMail } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import { buildHelpyReportBundle } from "@/features/workspace/services/vorgaenge/helpy-report-vorgang";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type MailVorgangBuildResult = {
  /** Nur echte Kunden-Vorgänge — System-Mails erzeugen KEINEN Eintrag. */
  customerBundles: GmailVorgangBundle[];
  /** Gmail-Nachrichten-IDs die verarbeitet wurden (auch ignorierte System-Mails). */
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
 * Striktes Mail-Intake: System-Mails werden verworfen (kein Vorgang, kein Report-Eintrag).
 * Nur bestätigte Kundenanfragen werden zu Vorgängen.
 */
export async function buildAllMailVorgangBundles(
  messages: UnifiedMailMessage[],
  activeSkill?: HelpySkill
): Promise<MailVorgangBuildResult> {
  const customerBundles: GmailVorgangBundle[] = [];
  const processedMessageIds: string[] = [];
  const gatePassed: UnifiedMailMessage[] = [];

  for (const message of messages) {
    processedMessageIds.push(message.providerMessageId);

    if (isHelpySystemUnifiedMail(message)) {
      customerBundles.push(buildHelpyReportBundle(message));
      continue;
    }

    const intake = evaluateMailIntake(toIntakeInput(message));
    if (!intake.shouldCreateVorgang) {
      continue;
    }

    gatePassed.push(message);
  }

  if (gatePassed.length === 0) {
    return { customerBundles, processedMessageIds };
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
    }
  }

  if (vorgangCandidates.length === 0) {
    return { customerBundles, processedMessageIds };
  }

  const results = analyzeUnifiedMailMessages(vorgangCandidates, activeSkill);
  customerBundles.push(...buildMailVorgangBundles(results, vorgangCandidates));

  return { customerBundles, processedMessageIds };
}

/** @deprecated Nutze customerBundles aus MailVorgangBuildResult */
export function extractCustomerBundles(bundles: GmailVorgangBundle[]): GmailVorgangBundle[] {
  return bundles.filter((bundle) => !isHelpyReportVorgang(bundle.liste));
}

export { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
