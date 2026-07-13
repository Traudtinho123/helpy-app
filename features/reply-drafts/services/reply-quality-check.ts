import type {
  GeneratedReplyVariants,
  MailAnalysisExtraction,
  ReplyQualityWarning,
} from "@/features/reply-drafts/types/mail-analysis-types";
import { isGenericReplyPhrase } from "@/features/reply-drafts/services/mail-analysis-extraction";

const GENERIC_REPLY_MARKERS = [
  "zur kenntnis genommen",
  "ich habe ihr anliegen",
  "ich habe dein anliegen",
  "bei rückfragen stehe ich",
  "your message has been received",
  "nous avons bien reçu",
];

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-zäöüß0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);
}

function questionAnswered(question: string, answer: string): boolean {
  const questionTokens = tokenize(question);
  if (questionTokens.length === 0) return true;

  const answerLower = answer.toLowerCase();
  const hits = questionTokens.filter((token) => answerLower.includes(token));
  return hits.length >= Math.min(2, questionTokens.length);
}

function containsSenderName(name: string, answer: string): boolean {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);

  if (parts.length === 0) return false;

  const answerLower = answer.toLowerCase();
  return parts.some((part) => answerLower.includes(part.toLowerCase()));
}

function buildGreetingLine(analysis: MailAnalysisExtraction): string {
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

export function runReplyQualityCheck(input: {
  draftText: string;
  analysis: MailAnalysisExtraction;
}): ReplyQualityWarning[] {
  const warnings: ReplyQualityWarning[] = [];
  const text = input.draftText.trim();

  for (const question of input.analysis.konkrete_fragen) {
    if (!questionAnswered(question, text)) {
      warnings.push({
        type: "unanswered_question",
        message: `Diese Frage wurde nicht beantwortet: ${question}`,
      });
    }
  }

  if (
    isGenericReplyPhrase(text) ||
    GENERIC_REPLY_MARKERS.some((marker) => text.toLowerCase().includes(marker))
  ) {
    warnings.push({
      type: "generic",
      message: "Antwort wirkt generisch — Bezug auf Mailinhalt prüfen",
    });
  }

  if (!containsSenderName(input.analysis.absender_name, text)) {
    warnings.push({
      type: "missing_name",
      message: `Absender-Name fehlt in der Anrede: ${input.analysis.absender_name}`,
    });
  }

  return warnings;
}

export function ensureSenderNameInReply(
  draftText: string,
  analysis: MailAnalysisExtraction
): string {
  if (containsSenderName(analysis.absender_name, draftText)) {
    return draftText;
  }

  const greeting = buildGreetingLine(analysis);
  const trimmed = draftText.trim();
  if (!trimmed) return `${greeting}\n\n`;
  return `${greeting}\n\n${trimmed}`;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function trimToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

export function buildVariantsFromSingleDraft(
  detailedDraft: string,
  analysis: MailAnalysisExtraction
): GeneratedReplyVariants {
  const detailed = ensureSenderNameInReply(detailedDraft, analysis);
  const paragraphs = detailed.split(/\n\n+/).filter(Boolean);
  const shortCore = paragraphs.slice(0, Math.min(3, paragraphs.length)).join("\n\n");
  const short = trimToWordLimit(shortCore, 80);

  return {
    short,
    detailed: trimToWordLimit(detailed, 150),
  };
}
