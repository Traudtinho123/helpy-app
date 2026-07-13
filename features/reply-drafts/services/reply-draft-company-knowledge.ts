import {
  resolveCompanyKnowledge,
} from "@/features/company-knowledge/services/company-knowledge-context";
import type { ReplyStyleId } from "@/features/company-knowledge/types/company-knowledge-types";
import { REPLY_STYLE_LABELS } from "@/features/company-knowledge/types/company-knowledge-types";
import type { ReplyTemplateOutcome } from "@/features/reply-drafts/types/reply-draft-types";
import {
  getCompanyProfileSnapshot,
  getLoadedCompanyId,
} from "@/lib/company/company-profile-service";
import type { CompanyProfile, DocumentLanguage } from "@/lib/company/company-profile-types";

export type ReplyDraftCompanyContext = {
  companyId: string;
  companyName: string;
  documentLanguage: DocumentLanguage;
  replyStyle: ReplyStyleId;
  replyStyleLabel: string;
  emailSignature: string;
  hasEmailSignature: boolean;
  hasCustomReplyStyle: boolean;
};

const CLOSING_PATTERNS = [
  /Mit freundlichen Grüßen\s*$/i,
  /Mit freundlichen Grüssen\s*$/i,
  /Freundliche Grüsse\s*$/i,
  /Best regards\s*$/i,
  /Cordialement\s*$/i,
];

function safeString(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function buildReplyDraftCompanyContext(
  profileOverride?: CompanyProfile
): ReplyDraftCompanyContext {
  const loadedCompanyId = getLoadedCompanyId();
  const snapshot = profileOverride ?? getCompanyProfileSnapshot();
  const activeProfile =
    loadedCompanyId && loadedCompanyId !== snapshot.companyId
      ? { ...snapshot, companyId: loadedCompanyId }
      : snapshot;

  const resolved = resolveCompanyKnowledge(activeProfile);
  const replyStyleLabel =
    resolved.replyStyle === "custom"
      ? safeString(resolved.replyStyleCustom) || REPLY_STYLE_LABELS.custom
      : REPLY_STYLE_LABELS[resolved.replyStyle];

  const emailSignature = safeString(resolved.emailSignature);

  return {
    companyId: activeProfile.companyId,
    companyName: safeString(activeProfile.companyName),
    documentLanguage: activeProfile.documentLanguage ?? "de",
    replyStyle: resolved.replyStyle,
    replyStyleLabel,
    emailSignature,
    hasEmailSignature: emailSignature.length > 0,
    hasCustomReplyStyle:
      resolved.replyStyle !== "friendly-professional" ||
      safeString(resolved.replyStyleCustom).length > 0,
  };
}

function localizeGreetingLine(
  draftText: string,
  senderName: string,
  language: DocumentLanguage,
  mailTon?: "formell" | "informell",
  mailSprache?: "de" | "en" | "fr"
): string {
  const lines = draftText.split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim().length > 0);
  if (firstContentIndex < 0) return draftText;

  const effectiveLanguage = mailSprache ?? language;
  const effectiveTon = mailTon ?? "formell";

  const greeting =
    effectiveLanguage === "en"
      ? effectiveTon === "informell"
        ? `Hi ${senderName},`
        : `Dear ${senderName},`
      : effectiveLanguage === "fr"
        ? effectiveTon === "informell"
          ? `Bonjour ${senderName},`
          : `Madame, Monsieur ${senderName},`
        : effectiveTon === "informell"
          ? `Hallo ${senderName},`
          : `Guten Tag ${senderName},`;

  lines[firstContentIndex] = greeting;
  return lines.join("\n");
}

function buildDefaultClosing(
  companyName: string,
  language: DocumentLanguage
): string {
  if (language === "en") {
    return companyName
      ? `Best regards\n${companyName}`
      : "Best regards";
  }
  if (language === "fr") {
    return companyName
      ? `Cordialement\n${companyName}`
      : "Cordialement";
  }
  return companyName
    ? `Mit freundlichen Grüssen\n${companyName}`
    : "Mit freundlichen Grüssen";
}

function stripClosingBlock(draftText: string): string {
  let result = draftText.trimEnd();
  for (const pattern of CLOSING_PATTERNS) {
    if (pattern.test(result)) {
      result = result.replace(pattern, "").trimEnd();
      break;
    }
  }
  return result;
}

function appendClosingOrSignature(
  draftText: string,
  context: ReplyDraftCompanyContext
): string {
  const body = stripClosingBlock(draftText);

  if (context.hasEmailSignature) {
    return `${body}\n\n${context.emailSignature}`;
  }

  return `${body}\n\n${buildDefaultClosing(context.companyName, context.documentLanguage)}`;
}

function shortenReplyBody(draftText: string): string {
  const paragraphs = draftText
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length <= 2) return draftText;

  const greeting = paragraphs[0];
  const closing = paragraphs[paragraphs.length - 1];
  const middle = paragraphs.slice(1, -1);

  const thankYou = middle.find((part) =>
    /vielen dank|thank you|merci/i.test(part)
  );
  const action = middle.find(
    (part) =>
      part !== thankYou &&
      !part.startsWith("•") &&
      !part.startsWith("Hinweis:")
  );

  const compactCore = [thankYou, action]
    .filter(Boolean)
    .map((part) => {
      const firstSentence = part?.match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0]?.trim();
      return firstSentence ?? part;
    })
    .filter(Boolean)
    .slice(0, 2);

  return [greeting, ...compactCore, closing].join("\n\n");
}

function expandReplyBody(
  draftText: string,
  language: DocumentLanguage
): string {
  if (/bei rückfragen|questions|n'hésitez pas/i.test(draftText)) {
    return draftText;
  }

  const addition =
    language === "en"
      ? "If you have any questions, I am happy to advise you in more detail."
      : language === "fr"
        ? "Pour toute question complémentaire, je reste à votre disposition."
        : "Bei Rückfragen berate ich Sie gerne ausführlicher.";

  const body = stripClosingBlock(draftText);
  const paragraphs = body.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length === 0) return draftText;

  const closing = paragraphs[paragraphs.length - 1];
  const content = paragraphs.slice(0, -1);
  return [...content, addition, closing].join("\n\n");
}

function applyReplyStyleToBody(
  draftText: string,
  context: ReplyDraftCompanyContext
): string {
  if (!context.hasCustomReplyStyle) return draftText;

  switch (context.replyStyle) {
    case "short-direct":
      return shortenReplyBody(draftText);
    case "detailed-advisory":
      return expandReplyBody(draftText, context.documentLanguage);
    case "custom":
      return draftText;
    default:
      return draftText;
  }
}

function resolveToneLabel(
  templateTone: string,
  context: ReplyDraftCompanyContext
): string {
  if (!context.hasCustomReplyStyle) return templateTone;
  return context.replyStyleLabel || templateTone;
}

export function applyCompanyKnowledgeToReplyDraft(
  outcome: ReplyTemplateOutcome,
  input: {
    senderName: string;
    mailTon?: "formell" | "informell";
    mailSprache?: "de" | "en" | "fr";
  },
  profile?: CompanyProfile
): ReplyTemplateOutcome {
  try {
    const context = buildReplyDraftCompanyContext(
      profile ?? getCompanyProfileSnapshot()
    );

    let draftText = outcome.draftText;
    draftText = localizeGreetingLine(
      draftText,
      input.senderName,
      context.documentLanguage,
      input.mailTon,
      input.mailSprache
    );
    draftText = applyReplyStyleToBody(draftText, context);
    draftText = appendClosingOrSignature(draftText, context);

    return {
      ...outcome,
      tone: resolveToneLabel(outcome.tone, context),
      draftText,
    };
  } catch {
    return outcome;
  }
}
