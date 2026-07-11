import {
  resolveCompanyKnowledge,
  resolveReplyStyleLabel,
  summarizeBusinessHours,
} from "@/features/company-knowledge/services/company-knowledge-context";
import type {
  BackgroundMemoryHint,
  BackgroundMemoryWorkspaceContext,
} from "@/features/memory/types/memory-types";
import {
  getCompanyProfileSnapshot,
  getLoadedCompanyId,
} from "@/lib/company/company-profile-service";

function resolveActiveCompanyProfile() {
  const loadedCompanyId = getLoadedCompanyId();
  const snapshot = getCompanyProfileSnapshot();
  return loadedCompanyId && loadedCompanyId !== snapshot.companyId
    ? { ...snapshot, companyId: loadedCompanyId }
    : snapshot;
}

export function buildCompanyBackgroundHints(
  context: BackgroundMemoryWorkspaceContext
): BackgroundMemoryHint[] {
  const resolved = resolveCompanyKnowledge(resolveActiveCompanyProfile());
  const hints: BackgroundMemoryHint[] = [];

  if (resolved.appointmentDurationViewingMinutes > 0) {
    hints.push({
      id: "company-besichtigungsdauer",
      rememberText: `Für dieses Unternehmen sind Besichtigungen standardmäßig ${resolved.appointmentDurationViewingMinutes} Minuten.`,
      tipText: context.hasAppointmentFlow
        ? `Ich plane Termine mit ${resolved.defaultBufferMinutes} Minuten Puffer ein.`
        : undefined,
      relevance: context.hasAppointmentFlow ? 75 : 40,
    });
  }

  const replyLabel = resolveReplyStyleLabel(resolved);
  if (replyLabel) {
    hints.push({
      id: "company-antwortstil",
      rememberText: `Antworten sollen ${replyLabel.toLowerCase()}.`,
      tipText: context.hasReplyDraft
        ? "Ich halte Entwürfe im gepflegten Antwortstil."
        : undefined,
      relevance: context.hasReplyDraft ? 70 : 35,
    });
  }

  const hoursSummary = summarizeBusinessHours(resolved);
  if (hoursSummary) {
    hints.push({
      id: "company-zeiten",
      rememberText: `Arbeitszeiten: ${hoursSummary}.`,
      tipText: context.hasAppointmentFlow
        ? "Terminvorschläge bleiben innerhalb dieser Zeiten."
        : undefined,
      relevance: context.hasAppointmentFlow ? 55 : 30,
    });
  }

  const firstRule = resolved.internalRules.find((rule) => rule.trim());
  if (firstRule && (context.hasAppointmentFlow || context.hasReplyDraft)) {
    hints.push({
      id: "company-interne-regel",
      rememberText: firstRule.trim(),
      relevance: context.hasAppointmentFlow ? 65 : 45,
    });
  }

  const firstFaq = resolved.faq.find(
    (entry) => entry.question.trim() && entry.answer.trim()
  );
  if (firstFaq) {
    hints.push({
      id: "company-faq",
      rememberText: `${firstFaq.question} — ${firstFaq.answer}`,
      relevance: 25,
    });
  }

  return hints;
}
