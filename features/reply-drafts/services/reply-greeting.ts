import type { MailAnalysisExtraction } from "@/features/reply-drafts/types/mail-analysis-types";
import { buildReplySalutation } from "@/features/reply-drafts/services/reply-salutation";

const GREETING_LINE_PATTERN =
  /^(guten tag|hallo|hi|hello|dear|bonjour|sehr geehrte|madame,\s*monsieur)/i;

export function buildReplyGreetingLine(analysis: MailAnalysisExtraction): string {
  const salutation = buildReplySalutation(analysis.absender_name);
  if (analysis.sprache === "en") {
    return analysis.ton === "informell" ? `Hi ${analysis.absender_name},` : `Dear ${analysis.absender_name},`;
  }
  if (analysis.sprache === "fr") {
    return analysis.ton === "informell"
      ? `Bonjour ${analysis.absender_name},`
      : `Madame, Monsieur ${analysis.absender_name},`;
  }
  return salutation.line;
}

export function hasReplyGreetingLine(text: string): boolean {
  const firstLine =
    text.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "";
  return GREETING_LINE_PATTERN.test(firstLine);
}

export function containsSenderName(name: string, answer: string): boolean {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);

  if (parts.length === 0) return false;

  const answerLower = answer.toLowerCase();
  return parts.some((part) => answerLower.includes(part.toLowerCase()));
}

/**
 * Ensures exactly one greeting line with the recipient name.
 * Replaces an existing generic greeting instead of prepending a second one.
 */
export function ensureSingleReplyGreeting(
  draftText: string,
  analysis: MailAnalysisExtraction
): string {
  const greeting = buildReplyGreetingLine(analysis);
  const lines = draftText.split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim().length > 0);

  if (firstContentIndex >= 0 && hasReplyGreetingLine(lines[firstContentIndex] ?? "")) {
    lines[firstContentIndex] = greeting;
    return lines.join("\n");
  }

  const trimmed = draftText.trim();
  if (!trimmed) return `${greeting}\n\n`;
  return `${greeting}\n\n${trimmed}`;
}
