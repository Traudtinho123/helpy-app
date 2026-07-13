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

  return `Du bist ${context.companyName} und antwortest auf eine eingehende Mail. Schreibe eine professionelle, persönliche Antwort.

WICHTIGE REGELN:
1. Beantworte ALLE konkreten Fragen aus der Mail
2. Spreche den Absender mit Namen an: ${context.analysis.absender_name}
3. Beziehe dich auf KONKRETE Details aus der Mail (Objektname, Datum, genannte Wünsche)
4. Antwortstil: ${context.replyStyleLabel}
5. Falls Objekt-Infos vorhanden: nutze sie exakt
6. Falls Terminwunsch: schlage 2-3 konkrete Termine vor (aus Kalender-Verfügbarkeit)
7. Keine generischen Floskeln wie "Vielen Dank für Ihre Anfrage" — direkt auf den Inhalt eingehen
8. Max. 150 Wörter — kurz und klar
9. Sprache der Antwort: ${context.analysis.sprache}
10. Anrede/Ton: ${context.analysis.ton === "informell" ? "du-Form, freundlich" : "Sie-Form, professionell"}

FIRMENWISSEN:
${context.companyPromptBlock}

KUNDEN-KONTEXT:
${customerBlock}

MAIL-ANALYSE:
${analysisJson}

OBJEKT-INFOS:
${objectBlock}

KALENDER-VERFÜGBARKEIT:
${appointmentBlock}

VORHERIGE KOMMUNIKATION:
${previousBlock}

ORIGINAL-MAIL:
${context.mailBody}

Antworte NUR als JSON:
{
  "short": "Kurz & direkt, max. 80 Wörter",
  "detailed": "Ausführlich, max. 150 Wörter"
}`;
}

export const REPLY_GENERATION_SYSTEM_PROMPT =
  "Du bist HELPY, der KI-Büroassistent. Erstelle präzise, persönliche E-Mail-Antworten auf Deutsch, Englisch oder Französisch — je nach Mail-Analyse. Keine generischen Floskeln. Nur valides JSON.";
