import {
  analyzeUnifiedMailMessages,
  buildMailVorgangBundles,
} from "@/features/mail/mail-brain-adapter";
import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import { classifyMailsForVorgangClient } from "@/features/mail/services/mail-vorgang-classifier";
import { detectSystemMailFromUnified } from "@/features/mail/services/system-mail-detector";
import { isHelpySystemUnifiedMail } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import {
  buildHelpyReportBundle,
  buildSystemMailReportBundle,
} from "@/features/workspace/services/vorgaenge/helpy-report-vorgang";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export async function buildAllMailVorgangBundles(
  messages: UnifiedMailMessage[],
  activeSkill?: HelpySkill
): Promise<GmailVorgangBundle[]> {
  const helpyBundles: GmailVorgangBundle[] = [];
  const customerMessages: UnifiedMailMessage[] = [];

  for (const message of messages) {
    if (isHelpySystemUnifiedMail(message)) {
      helpyBundles.push(buildHelpyReportBundle(message));
      continue;
    }

    const systemDetection = detectSystemMailFromUnified(message);
    if (systemDetection.isSystemMail) {
      if (systemDetection.category === "own_sent") {
        continue;
      }
      helpyBundles.push(buildSystemMailReportBundle(message, systemDetection));
      continue;
    }

    customerMessages.push(message);
  }

  if (customerMessages.length === 0) {
    return helpyBundles;
  }

  const classificationInputs = customerMessages.map((message) => ({
    messageId: message.providerMessageId,
    from: message.from,
    subject: message.subject,
    bodyPreview: message.bodyPreview || message.snippet,
  }));

  const classifications = await classifyMailsForVorgangClient(classificationInputs);
  const vorgangCandidates = customerMessages.filter((message) => {
    const classification = classifications.get(message.providerMessageId);
    return classification?.ist_vorgang !== false;
  });

  const rejected = customerMessages.filter(
    (message) => !vorgangCandidates.includes(message)
  );

  for (const message of rejected) {
    const classification = classifications.get(message.providerMessageId);
    helpyBundles.push(
      buildSystemMailReportBundle(message, {
        isSystemMail: true,
        category: "system_transaction",
        reason:
          classification?.grund ??
          "KI-Klassifikation: Kein Kunden-Vorgang",
      })
    );
  }

  if (vorgangCandidates.length === 0) {
    return helpyBundles;
  }

  const results = analyzeUnifiedMailMessages(vorgangCandidates, activeSkill);
  const customerBundles = buildMailVorgangBundles(results, vorgangCandidates);

  return [...helpyBundles, ...customerBundles];
}

export { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
