import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { applyCompanyKnowledgeToReplyDraft } from "@/features/reply-drafts/services/reply-draft-company-knowledge";
import {
  buildReplyGenerationContext,
} from "@/features/reply-drafts/services/reply-generation-prompt";
import {
  buildVariantsFromSingleDraft,
  ensureSenderNameInReply,
  runReplyQualityCheck,
  trimToWordLimit,
} from "@/features/reply-drafts/services/reply-quality-check";
import { evaluateReplyTemplateRules } from "@/features/reply-drafts/services/reply-template-rules";
import type {
  GeneratedReplyVariants,
  MailAnalysisExtraction,
  ReplyDraftVariantId,
  ReplyGenerationContext,
  ReplyGenerationResult,
  ReplyQualityWarning,
} from "@/features/reply-drafts/types/mail-analysis-types";
import type {
  ReplyDraftInput,
  ReplyTemplateOutcome,
} from "@/features/reply-drafts/types/reply-draft-types";

function replySubject(originalSubject: string): string {
  const trimmed = originalSubject.trim();
  if (!trimmed) return "Re: Ihre Nachricht";
  return trimmed.toLowerCase().startsWith("re:") ? trimmed : `Re: ${trimmed}`;
}

function buildGreeting(analysis: MailAnalysisExtraction): string {
  const name = analysis.absender_name;
  if (analysis.sprache === "en") {
    return analysis.ton === "informell" ? `Hi ${name},` : `Dear ${name},`;
  }
  if (analysis.sprache === "fr") {
    return analysis.ton === "informell"
      ? `Bonjour ${name},`
      : `Madame, Monsieur ${name},`;
  }
  return analysis.ton === "informell"
    ? `Hallo ${name},`
    : `Guten Tag ${name},`;
}

function answerQuestionsBlock(
  analysis: MailAnalysisExtraction,
  context: ReplyGenerationContext
): string {
  if (analysis.konkrete_fragen.length === 0) return "";

  const object = context.objectLookups[0];
  const lines = analysis.konkrete_fragen.map((question) => {
    const lower = question.toLowerCase();
    if (object) {
      if (/verfügbar|verfuegbar|available|disponible/.test(lower)) {
        return `• ${question} — Ja, ${object.adresse} ist aktuell verfügbar${object.verfuegbarkeit ? ` (${object.verfuegbarkeit})` : ""}.`;
      }
      if (/preis|miete|kosten|price|prix/.test(lower) && object.preis) {
        return `• ${question} — Der Preis beträgt ${object.preis}.`;
      }
      if (/zimmer|room|pièces/.test(lower) && object.zimmer) {
        return `• ${question} — ${object.zimmer} Zimmer.`;
      }
      if (/fläche|flaeche|m²|qm|surface/.test(lower) && object.wohnflaeche) {
        return `• ${question} — ${object.wohnflaeche}.`;
      }
    }
    return `• ${question} — Ich kläre das gerne direkt mit den Details aus Ihrer Anfrage.`;
  });

  const heading =
    analysis.sprache === "en"
      ? "To your questions:"
      : analysis.sprache === "fr"
        ? "Concernant vos questions :"
        : analysis.ton === "informell"
          ? "Zu deinen Fragen:"
          : "Zu Ihren Fragen:";

  return `${heading}\n${lines.join("\n")}`;
}

function buildObjectParagraph(context: ReplyGenerationContext): string {
  const object = context.objectLookups[0];
  if (!object) return "";

  if (context.analysis.sprache === "en") {
    return `Regarding ${object.adresse}: ${object.zimmer ?? "—"} rooms, ${object.wohnflaeche ?? "—"}, ${object.preis ?? "price on request"}.`;
  }
  if (context.analysis.sprache === "fr") {
    return `Concernant ${object.adresse} : ${object.zimmer ?? "—"} pièces, ${object.wohnflaeche ?? "—"}, ${object.preis ?? "prix sur demande"}.`;
  }

  const pronoun = context.analysis.ton === "informell" ? "Die Wohnung" : "Die Wohnung";
  return `${pronoun} an der ${object.adresse} ist verfügbar — ${object.zimmer ?? "—"} Zimmer, ${object.wohnflaeche ?? "—"}, ${object.preis ?? "Preis auf Anfrage"}.`;
}

function buildAppointmentParagraph(context: ReplyGenerationContext): string {
  if (context.appointmentSlotLines.length === 0) return "";

  const heading =
    context.analysis.sprache === "en"
      ? "I can offer these viewing slots:"
      : context.analysis.sprache === "fr"
        ? "Je peux proposer ces créneaux :"
        : context.analysis.ton === "informell"
          ? "Folgende Termine würden passen:"
          : "Gerne schlage ich folgende Termine vor:";

  return `${heading}\n${context.appointmentSlotLines.join("\n")}`;
}

function buildEnrichedDraftBody(
  context: ReplyGenerationContext
): string {
  const { analysis } = context;
  const parts = [
    buildGreeting(analysis),
    buildObjectParagraph(context),
    analysis.anliegen ? analysis.anliegen : null,
    answerQuestionsBlock(analysis, context),
    buildAppointmentParagraph(context),
    analysis.gewuenschte_aktion === "Termin vereinbaren" &&
    context.appointmentSlotLines.length === 0
      ? analysis.sprache === "en"
        ? "Please let me know which day works best for you."
        : analysis.sprache === "fr"
          ? "Dites-moi quel jour vous conviendrait le mieux."
          : analysis.ton === "informell"
            ? "Sag mir einfach, welcher Tag dir am besten passt."
            : "Teilen Sie mir bitte mit, welcher Tag Ihnen am besten passt."
      : null,
  ].filter(Boolean);

  return parts.join("\n\n");
}

function applyCompanyStyling(
  outcome: ReplyTemplateOutcome,
  input: ReplyDraftInput,
  analysis?: { ton: "formell" | "informell"; sprache: "de" | "en" | "fr" }
): ReplyTemplateOutcome {
  return applyCompanyKnowledgeToReplyDraft(outcome, {
    senderName: input.senderName,
    mailTon: analysis?.ton,
    mailSprache: analysis?.sprache,
  });
}

export function buildEnrichedTemplateOutcome(
  input: ReplyDraftInput,
  appointmentSlots: AppointmentSlot[] = []
): ReplyTemplateOutcome {
  const context = buildReplyGenerationContext(input, appointmentSlots);
  const fallback = evaluateReplyTemplateRules(input, appointmentSlots);

  if (
    context.objectLookups.length === 0 &&
    context.analysis.konkrete_fragen.length === 0 &&
    context.analysis.genannte_objekte.length === 0
  ) {
    return fallback;
  }

  const draftText = buildEnrichedDraftBody(context);
  const styled = applyCompanyStyling(
    {
      ...fallback,
      draftText,
      tone:
        context.analysis.ton === "informell"
          ? "Freundlich und direkt"
          : "Professionell und persönlich",
      missingInfo: fallback.missingInfo,
    },
    input,
    context.analysis
  );

  return styled;
}

export function buildReplyGenerationResult(input: {
  context: ReplyGenerationContext;
  variants: GeneratedReplyVariants;
  subject?: string;
  generationSource: "gpt" | "enriched-template";
  selectedVariant?: ReplyDraftVariantId;
}): ReplyGenerationResult {
  const selectedVariant = input.selectedVariant ?? "detailed";
  const rawDraft =
    selectedVariant === "short"
      ? input.variants.short
      : input.variants.detailed;

  const draftText = ensureSenderNameInReply(rawDraft, input.context.analysis);
  const qualityWarnings = runReplyQualityCheck({
    draftText,
    analysis: input.context.analysis,
  });

  return {
    variants: {
      short: trimToWordLimit(
        ensureSenderNameInReply(input.variants.short, input.context.analysis),
        80
      ),
      detailed: trimToWordLimit(
        ensureSenderNameInReply(input.variants.detailed, input.context.analysis),
        150
      ),
    },
    selectedVariant,
    draftText,
    tone:
      input.context.analysis.ton === "informell"
        ? "Freundlich und direkt"
        : "Professionell und persönlich",
    subject: input.subject ?? replySubject(input.context.mailBody.split("\n")[0] ?? ""),
    qualityWarnings,
    analysis: input.context.analysis,
    generationSource: input.generationSource,
  };
}

export function buildEnrichedTemplateGenerationResult(
  input: ReplyDraftInput,
  appointmentSlots: AppointmentSlot[] = []
): ReplyGenerationResult {
  const context = buildReplyGenerationContext(input, appointmentSlots);
  const outcome = buildEnrichedTemplateOutcome(input, appointmentSlots);
  const variants = buildVariantsFromSingleDraft(outcome.draftText, context.analysis);

  return buildReplyGenerationResult({
    context,
    variants,
    subject: outcome.subject,
    generationSource: "enriched-template",
    selectedVariant: "detailed",
  });
}

export function mergeQualityWarnings(
  existing: ReplyQualityWarning[],
  next: ReplyQualityWarning[]
): ReplyQualityWarning[] {
  const seen = new Set(existing.map((warning) => warning.message));
  const merged = [...existing];
  for (const warning of next) {
    if (seen.has(warning.message)) continue;
    seen.add(warning.message);
    merged.push(warning);
  }
  return merged;
}
