import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { buildReplyCustomerContext } from "@/features/reply-drafts/services/reply-customer-context";
import {
  buildEnrichedTemplateGenerationResult,
  buildReplyGenerationResult,
} from "@/features/reply-drafts/services/reply-enriched-template";
import { buildReplyGenerationContext } from "@/features/reply-drafts/services/reply-generation-prompt";
import {
  generateReplyVariantsWithGpt,
  isReplyGptConfigured,
  refineMailAnalysisWithGpt,
} from "@/features/reply-drafts/services/reply-gpt-generator";
import { lookupObjectsForMailQueries } from "@/features/reply-drafts/services/reply-object-lookup";
import type { ReplyGenerationResult } from "@/features/reply-drafts/types/mail-analysis-types";
import type { ReplyDraftInput } from "@/features/reply-drafts/types/reply-draft-types";

function replySubject(originalSubject: string): string {
  const trimmed = originalSubject.trim();
  if (!trimmed) return "Re: Ihre Nachricht";
  return trimmed.toLowerCase().startsWith("re:") ? trimmed : `Re: ${trimmed}`;
}

function buildDraftInputWithBody(
  draftInput: ReplyDraftInput,
  mailBody: string,
  from: string
): ReplyDraftInput {
  return {
    ...draftInput,
    snippet: mailBody,
    gmailMessage: {
      subject: draftInput.subject,
      from,
      snippet: mailBody,
    },
  };
}

export async function generateIntelligentReplyDraft(input: {
  draftInput: ReplyDraftInput;
  mailBody: string;
  appointmentSlots?: AppointmentSlot[];
  preferGpt?: boolean;
}): Promise<ReplyGenerationResult> {
  const appointmentSlots = input.appointmentSlots ?? [];
  const from =
    input.draftInput.originalFrom ??
    input.draftInput.gmailMessage?.from ??
    `${input.draftInput.senderName} <${input.draftInput.senderEmail}>`;

  const normalizedInput = buildDraftInputWithBody(
    input.draftInput,
    input.mailBody,
    from
  );

  let context = buildReplyGenerationContext(normalizedInput, appointmentSlots);

  if ((input.preferGpt ?? true) && isReplyGptConfigured()) {
    const refinedAnalysis = await refineMailAnalysisWithGpt({
      from,
      subject: input.draftInput.subject,
      body: input.mailBody,
      baseline: context.analysis,
    });

    context = {
      ...context,
      analysis: refinedAnalysis,
      objectLookups: lookupObjectsForMailQueries(refinedAnalysis.genannte_objekte),
      customerContext: buildReplyCustomerContext(normalizedInput),
    };

    const variants = await generateReplyVariantsWithGpt(context);
    if (variants) {
      return buildReplyGenerationResult({
        context,
        variants,
        subject: replySubject(input.draftInput.subject),
        generationSource: "gpt",
        selectedVariant: "detailed",
      });
    }
  }

  return buildEnrichedTemplateGenerationResult(normalizedInput, appointmentSlots);
}
