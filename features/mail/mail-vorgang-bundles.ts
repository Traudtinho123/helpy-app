import {
  analyzeUnifiedMailMessages,
  buildMailVorgangBundles,
} from "@/features/mail/mail-brain-adapter";
import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import { isHelpySystemUnifiedMail } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import { buildHelpyReportBundle } from "@/features/workspace/services/vorgaenge/helpy-report-vorgang";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export function buildAllMailVorgangBundles(
  messages: UnifiedMailMessage[],
  activeSkill?: HelpySkill
): GmailVorgangBundle[] {
  const helpyBundles: GmailVorgangBundle[] = [];
  const customerMessages: UnifiedMailMessage[] = [];

  for (const message of messages) {
    if (isHelpySystemUnifiedMail(message)) {
      helpyBundles.push(buildHelpyReportBundle(message));
    } else {
      customerMessages.push(message);
    }
  }

  if (customerMessages.length === 0) {
    return helpyBundles;
  }

  const results = analyzeUnifiedMailMessages(customerMessages, activeSkill);
  const customerBundles = buildMailVorgangBundles(results, customerMessages);

  return [...helpyBundles, ...customerBundles];
}

export { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
