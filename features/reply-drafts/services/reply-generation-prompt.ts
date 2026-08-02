import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import {
  buildCompanyKnowledgePromptBlock,
  resolveReplyStyleLabel,
  resolveCompanyKnowledge,
} from "@/features/company-knowledge/services/company-knowledge-context";
import {
  buildReplyDraftCompanyContext,
} from "@/features/reply-drafts/services/reply-draft-company-knowledge";
import {
  buildReplyCustomerContext,
  formatCustomerContextBlock,
  formatPreviousCommunicationBlock,
} from "@/features/reply-drafts/services/reply-customer-context";
import { extractMailAnalysisRuleBased } from "@/features/reply-drafts/services/mail-analysis-extraction";
import {
  formatObjectLookupBlock,
  lookupObjectsForMailQueries,
} from "@/features/reply-drafts/services/reply-object-lookup";
import type { ReplyGenerationContext } from "@/features/reply-drafts/types/mail-analysis-types";
import type { ReplyDraftInput } from "@/features/reply-drafts/types/reply-draft-types";
import { buildReplySalutation } from "@/features/reply-drafts/services/reply-salutation";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";

function resolveMailBody(input: ReplyDraftInput): string {
  return (
    input.snippet ??
    input.gmailMessage?.snippet ??
    input.brainResult?.summary ??
    ""
  );
}

function resolveOriginalFrom(input: ReplyDraftInput): string {
  return (
    input.originalFrom ??
    input.gmailMessage?.from ??
    input.brainResult?.from ??
    `${input.senderName} <${input.senderEmail}>`
  );
}

export function buildReplyGenerationContext(
  input: ReplyDraftInput,
  appointmentSlots: AppointmentSlot[] = []
): ReplyGenerationContext {
  const mailBody = resolveMailBody(input);
  const from = resolveOriginalFrom(input);
  const profile = getCompanyProfileSnapshot();
  const companyContext = buildReplyDraftCompanyContext(profile);
  const resolvedKnowledge = resolveCompanyKnowledge(profile);

  const analysis = extractMailAnalysisRuleBased({
    from,
    subject: input.subject,
    body: mailBody,
    brainResult: input.brainResult,
  });

  const objectLookups = lookupObjectsForMailQueries(analysis.genannte_objekte);
  const customerContext = buildReplyCustomerContext(input);

  return {
    mailBody,
    analysis,
    objectLookups,
    customerContext,
    appointmentSlotLines: appointmentSlots.map(
      (slot, index) =>
        `📅 Option ${index + 1}: ${slot.dateLabel} · ${slot.start} Uhr`
    ),
    companyPromptBlock: buildCompanyKnowledgePromptBlock(profile),
    companyName: companyContext.companyName || profile.companyName,
    replyStyleLabel:
      companyContext.replyStyleLabel ||
      resolveReplyStyleLabel(resolvedKnowledge),
  };
}

export function buildReplyGenerationUserPrompt(
  context: ReplyGenerationContext
): string {
  const analysisJson = JSON.stringify(context.analysis, null, 2);
  const objectBlock = formatObjectLookupBlock(context.objectLookups) || "—";
  const customerBlock = formatCustomerContextBlock(context.customerContext);
  const previousBlock =
    formatPreviousCommunicationBlock(context.customerContext) || "—";
  const appointmentBlock =
    context.appointmentSlotLines.length > 0
      ? context.appointmentSlotLines.join("\n")
      : "Keine Kalender-Slots verfügbar — schlage 2–3 realistische Termine vor.";

  const salutation = buildReplySalutation(context.analysis.absender_name);

  return `Du bist ${context.companyName} und schreibst eine E-Mail-Antwort. Halte dich EXAKT an die vorgegebene Struktur.

ABSENDER: ${context.analysis.absender_name}
ANREDE: ${salutation.line}
ANLIEGEN: ${context.analysis.anliegen}
OBJEKT: ${objectBlock}
TERMINE: ${appointmentBlock}
SIGNATUR: (exakt aus Firmenwissen unten)

ORIGINAL-MAIL:
${context.mailBody}

STRUKTUR (halte dich exakt daran):
Zeile 1: ${salutation.line}
Zeile 2: leer
Zeile 3-5: Antwort auf Anliegen (1-2 Sätze, konkret)
Zeile 6: leer
${context.appointmentSlotLines.length > 0 ? "Zeile 7-11: Terminvorschläge\nZeile 12: leer\n" : ""}Zeile ${context.appointmentSlotLines.length > 0 ? "13" : "7"}: Abschluss-Satz
Zeile ${context.appointmentSlotLines.length > 0 ? "14" : "8"}: leer
Zeile ${context.appointmentSlotLines.length > 0 ? "15+" : "9+"}: Signatur aus Firmenwissen

REGELN:
- Keine doppelte Begrüssung
- Keine Platzhalter wie [NAME] oder [DATUM]
- Keine generischen Floskeln ohne Bezug zur Mail
- Max. 150 Wörter

FIRMENWISSEN:
${context.companyPromptBlock}

Antworte NUR als JSON:
{
  "short": "Fertiger Mail-Text (kurz)",
  "detailed": "Fertiger Mail-Text (ausführlich, max. 150 Wörter)"
}`;
}

export const REPLY_GENERATION_SYSTEM_PROMPT =
  "Du bist HELPY und schreibst E-Mail-Antworten. Halte dich EXAKT an die vorgegebene Struktur. Keine Abweichungen, keine doppelten Begrüssungen. Nur valides JSON.";
