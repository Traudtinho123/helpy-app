import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import {
  resolvePlatformInteressentEmail,
  resolvePlatformInteressentName,
} from "@/features/brain/services/platform-inquiry-context";
import {
  extractSenderName,
} from "@/features/brain/services/brain-result-to-vorgang";
import { getHelpyDecision, getOrEvaluateHelpyDecision } from "@/features/decision/services/decision-engine";
import { GMAIL_SEND_CONFIRM_BUTTON_LABEL } from "@/features/gmail/services/gmail-drafts";
import {
  extractEmailAddress,
  resolveReplyRecipient,
} from "@/features/gmail/services/extract-email-address";
import { getSkillMemories } from "@/features/memory/services";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import { evaluateReplyTemplateRules } from "@/features/reply-drafts/services/reply-template-rules";
import { buildEnrichedTemplateGenerationResult } from "@/features/reply-drafts/services/reply-enriched-template";
import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { getAppointmentSuggestion } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import type {
  ReplyDraft,
  ReplyDraftEvaluation,
  ReplyDraftInput,
  ReplyDraftStatus,
} from "@/features/reply-drafts/types/reply-draft-types";
import type {
  ReplyDraftVariantId,
  ReplyGenerationResult,
} from "@/features/reply-drafts/types/mail-analysis-types";
import type { HelpyReview } from "@/features/review/services/types";
import {
  HELPY_PREPARED_LABEL,
} from "@/features/review/services/safety/review-mode";
import { REVIEW_CONFIRM_MESSAGE } from "@/features/review/services/types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

const drafts = new Map<string, ReplyDraft>();
const draftInputs = new Map<string, ReplyDraftInput>();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function resolveOriginalFrom(input: ReplyDraftInput): string {
  return (
    input.originalFrom ??
    input.gmailMessage?.from ??
    input.brainResult?.from ??
    (input.senderEmail
      ? input.senderEmail.includes("@")
        ? input.senderEmail
        : `${input.senderName} <${input.senderEmail}>`.trim()
      : input.senderName)
  );
}

function isHelpySkill(value?: string): value is HelpySkill {
  return (
    value === "real-estate" ||
    value === "construction" ||
    value === "consulting-legal"
  );
}

function skillFromLabel(label?: string): HelpySkill | undefined {
  if (!label) return undefined;
  if (label.includes("Real Estate")) return "real-estate";
  if (label.includes("Construction")) return "construction";
  if (label.includes("Consulting")) return "consulting-legal";
  return undefined;
}

export function subscribeReplyDraft(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function buildReplyDraftInputFromListe(
  vorgang: ListeVorgang
): ReplyDraftInput {
  const skill =
    (isHelpySkill(vorgang.skill) ? vorgang.skill : undefined) ??
    skillFromLabel(vorgang.skillLabel);
  const platformEmail = resolvePlatformInteressentEmail(vorgang);
  const platformName = resolvePlatformInteressentName(vorgang);
  const originalFrom = vorgang.from ?? "";
  const from = originalFrom;
  const senderName =
    platformName ?? extractSenderName(from || vorgang.kunde);
  const senderEmail =
    platformEmail ?? extractEmailAddress(from) ?? "";
  const resolvedOriginalFrom = platformEmail
    ? `${senderName} <${platformEmail}>`
    : originalFrom;
  const decision = getOrEvaluateHelpyDecision(vorgang) ?? undefined;

  return {
    vorgangId: vorgang.id,
    skill,
    skillLabel: vorgang.skillLabel,
    intent: vorgang.intent ?? vorgang.typ,
    intentLabel: vorgang.intentLabel ?? vorgang.typ,
    priority: vorgang.prioritaet,
    senderName,
    senderEmail,
    subject: vorgang.titel,
    snippet: vorgang.snippet,
    decision,
    originalFrom: resolvedOriginalFrom,
    gmailMessage: resolvedOriginalFrom
      ? {
          subject: vorgang.titel,
          from: resolvedOriginalFrom,
          snippet: vorgang.snippet ?? "",
        }
      : undefined,
    memoryHints: skill
      ? getSkillMemories(skill).slice(0, 1).map((entry) => entry.insight)
      : [],
  };
}

export function buildReplyDraftInputFromBundle(
  bundle: GmailVorgangBundle
): ReplyDraftInput {
  const base = buildReplyDraftInputFromListe(bundle.liste);

  return {
    ...base,
    brainResult: bundle.brain,
    subject: bundle.message.subject,
    snippet: bundle.message.snippet,
    decision: getHelpyDecision(bundle.liste.id) ?? base.decision,
    gmailMessage: {
      subject: bundle.message.subject,
      from: base.originalFrom ?? bundle.message.from,
      snippet: bundle.message.snippet,
    },
  };
}

export function buildReplyDraftInputFromWorkspace(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): ReplyDraftInput {
  if (liste) return buildReplyDraftInputFromListe(liste);

  const originalFrom = vorgang.letzteEmail.absender;
  const skill = vorgang.skill;

  return {
    vorgangId: vorgang.id,
    skill,
    intent: vorgang.aufgabe.kategorie,
    intentLabel: vorgang.kopfzeile?.intentLabel ?? vorgang.aufgabe.kategorie,
    priority: "mittel",
    senderName: extractSenderName(originalFrom),
    senderEmail: extractEmailAddress(originalFrom) ?? "",
    subject: vorgang.letzteEmail.betreff,
    snippet: vorgang.letzteEmail.inhalt,
    decision: getHelpyDecision(vorgang.id) ?? undefined,
    originalFrom,
    gmailMessage: {
      subject: vorgang.letzteEmail.betreff,
      from: originalFrom,
      snippet: vorgang.letzteEmail.inhalt,
    },
    memoryHints: getSkillMemories(skill).slice(0, 1).map((entry) => entry.insight),
  };
}

function buildReplyDraft(
  input: ReplyDraftInput,
  status: ReplyDraftStatus = "vorbereitet",
  appointmentSlots: AppointmentSlot[] = []
): ReplyDraft {
  const generated = buildEnrichedTemplateGenerationResult(input, appointmentSlots);
  const template = evaluateReplyTemplateRules(input, appointmentSlots);
  const originalFrom = resolveOriginalFrom(input);
  const recipient = resolveReplyRecipient(originalFrom);

  return {
    id: `reply-draft-${input.vorgangId}`,
    vorgangId: input.vorgangId,
    recipient: recipient.display,
    recipientEmail: recipient.email,
    originalFrom,
    recipientValid: recipient.isValid,
    subject: generated.subject,
    tone: generated.tone,
    draftText: generated.draftText,
    missingInfo: template.missingInfo,
    suggestedAttachments: template.suggestedAttachments,
    needsConfirmation: true,
    status,
    generationSource: generated.generationSource,
    generationState: "ready",
    selectedVariant: generated.selectedVariant,
    variants: generated.variants,
    qualityWarnings: generated.qualityWarnings,
    mailAnalysis: generated.analysis,
  };
}

export function evaluateReplyDraft(input: ReplyDraftInput): ReplyDraftEvaluation {
  const existing = drafts.get(input.vorgangId);
  const suggestion = getAppointmentSuggestion(input.vorgangId);
  const slots =
    suggestion?.status === "vorbereitet" ? suggestion.slots : [];
  const draft = buildReplyDraft(input, existing?.status ?? "vorbereitet", slots);

  if (
    existing &&
    (existing.status === "bearbeitet" ||
      existing.status === "bestaetigt" ||
      existing.status === "uebernommen")
  ) {
    drafts.set(input.vorgangId, {
      ...draft,
      draftText: existing.draftText,
      subject: existing.subject,
      status: existing.status,
    });
  } else {
    drafts.set(input.vorgangId, draft);
  }

  draftInputs.set(input.vorgangId, input);
  notify();

  return {
    input,
    draft: drafts.get(input.vorgangId)!,
  };
}

function storeReplyDraftSilently(input: ReplyDraftInput): ReplyDraft | null {
  const existing = drafts.get(input.vorgangId);
  if (existing) return existing;

  draftInputs.set(input.vorgangId, input);
  const suggestion = getAppointmentSuggestion(input.vorgangId);
  const slots =
    suggestion?.status === "vorbereitet" ? suggestion.slots : [];
  const draft = buildReplyDraft(input, "vorbereitet", slots);
  drafts.set(input.vorgangId, draft);
  return draft;
}

export function refreshReplyDraftWithAppointmentSlots(
  vorgangId: string,
  slots: AppointmentSlot[]
): ReplyDraft | null {
  const existing = drafts.get(vorgangId);
  const input = draftInputs.get(vorgangId);
  if (!existing || !input || existing.status !== "vorbereitet") {
    return existing ?? null;
  }

  const template = evaluateReplyTemplateRules(input, slots);
  const updated: ReplyDraft = {
    ...existing,
    draftText: template.draftText,
    missingInfo: template.missingInfo,
    suggestedAttachments: template.suggestedAttachments,
  };

  drafts.set(vorgangId, updated);
  notify();
  return updated;
}

export function evaluateReplyDraftFromListe(
  vorgang: ListeVorgang
): ReplyDraft | null {
  if (shouldPrepareArchive(vorgang)) return null;
  return evaluateReplyDraft(buildReplyDraftInputFromListe(vorgang)).draft;
}

export function evaluateReplyDraftFromWorkspace(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): ReplyDraft | null {
  return evaluateReplyDraft(
    buildReplyDraftInputFromWorkspace(vorgang, liste)
  ).draft;
}

export function getReplyDraft(vorgangId: string): ReplyDraft | null {
  return drafts.get(vorgangId) ?? null;
}

export function getOrEvaluateReplyDraft(vorgang: ListeVorgang): ReplyDraft | null {
  if (shouldPrepareArchive(vorgang)) return null;
  const existing = getReplyDraft(vorgang.id);
  if (existing) return existing;
  return storeReplyDraftSilently(buildReplyDraftInputFromListe(vorgang));
}

export function getOrEvaluateReplyDraftForWorkspace(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): ReplyDraft | null {
  if (liste && shouldPrepareArchive(liste)) return null;
  const existing = getReplyDraft(vorgang.id);
  if (existing) return existing;
  return storeReplyDraftSilently(
    buildReplyDraftInputFromWorkspace(vorgang, liste)
  );
}

export function updateReplyDraftText(
  vorgangId: string,
  draftText: string,
  subject?: string
): ReplyDraft | null {
  const existing = drafts.get(vorgangId);
  if (!existing) return null;

  const updated: ReplyDraft = {
    ...existing,
    draftText,
    subject: subject ?? existing.subject,
    status: "bearbeitet",
  };

  drafts.set(vorgangId, updated);
  notify();
  return updated;
}

export function setReplyDraftGenerationState(
  vorgangId: string,
  generationState: ReplyDraft["generationState"]
): ReplyDraft | null {
  const existing = drafts.get(vorgangId);
  if (!existing) return null;

  const updated: ReplyDraft = { ...existing, generationState };
  drafts.set(vorgangId, updated);
  notify();
  return updated;
}

export function selectReplyVariant(
  vorgangId: string,
  variant: ReplyDraftVariantId
): ReplyDraft | null {
  const existing = drafts.get(vorgangId);
  if (!existing?.variants) return null;

  const draftText =
    variant === "short"
      ? existing.variants.short
      : existing.variants.detailed;

  const updated: ReplyDraft = {
    ...existing,
    selectedVariant: variant,
    draftText,
    status: existing.status === "uebernommen" ? existing.status : "bearbeitet",
  };

  drafts.set(vorgangId, updated);
  notify();
  return updated;
}

export function applyGeneratedReplyDraft(
  vorgangId: string,
  generated: ReplyGenerationResult
): ReplyDraft | null {
  const existing = drafts.get(vorgangId);
  if (!existing) return null;

  const updated: ReplyDraft = {
    ...existing,
    subject: generated.subject,
    tone: generated.tone,
    draftText: generated.draftText,
    generationSource: generated.generationSource,
    generationState: "ready",
    selectedVariant: generated.selectedVariant,
    variants: generated.variants,
    qualityWarnings: generated.qualityWarnings,
    mailAnalysis: generated.analysis,
    status:
      existing.status === "bearbeitet" ||
      existing.status === "bestaetigt" ||
      existing.status === "uebernommen"
        ? existing.status
        : "vorbereitet",
  };

  drafts.set(vorgangId, updated);
  notify();
  return updated;
}

export function confirmReplyDraft(vorgangId: string): ReplyDraft | null {
  const existing = drafts.get(vorgangId);
  if (!existing) return null;

  const updated: ReplyDraft = {
    ...existing,
    status: "bestaetigt",
  };

  drafts.set(vorgangId, updated);
  notify();
  return updated;
}

export function adoptReplyDraft(vorgangId: string): ReplyDraft | null {
  const existing = drafts.get(vorgangId);
  if (!existing) return null;

  const updated: ReplyDraft = {
    ...existing,
    status: "uebernommen",
  };

  drafts.set(vorgangId, updated);
  notify();
  return updated;
}

export function seedReplyDraftsFromBundles(bundles: GmailVorgangBundle[]): void {
  for (const bundle of bundles) {
    if (shouldPrepareArchive(bundle.liste)) continue;
    evaluateReplyDraft(buildReplyDraftInputFromBundle(bundle));
  }
}

export function seedReplyDraftsFromListeVorgaenge(
  vorgaenge: ListeVorgang[]
): void {
  for (const vorgang of vorgaenge) {
    if (!shouldPrepareArchive(vorgang)) {
      evaluateReplyDraftFromListe(vorgang);
    }
  }
}

export function removeReplyDraft(vorgangId: string): void {
  if (drafts.delete(vorgangId)) notify();
}

export function createReviewForReplyDraft(
  draft: ReplyDraft,
  options?: { mailProvider?: "gmail" | "outlook" }
): HelpyReview {
  const primaryLabel =
    options?.mailProvider === "outlook"
      ? "Bestätigen & über Outlook senden"
      : GMAIL_SEND_CONFIRM_BUTTON_LABEL;

  return {
    id: `review-${draft.id}`,
    instanceId: draft.id,
    actionTypeId: "antwort-vorbereiten",
    actionTitle: "Antwort von HELPY vorbereitet",
    title: "Antwort prüfen",
    helpyHint: HELPY_PREPARED_LABEL,
    content: {
      kind: "antwort",
      betreff: draft.subject,
      empfaenger: draft.recipient,
      tonalitaet: draft.tone,
      antworttext: draft.draftText,
      primaryLabel,
      fehlendeAngaben: draft.missingInfo,
      anhaenge: draft.suggestedAttachments,
    },
  };
}

export function getReplyDraftConfirmMessage(): string {
  return REVIEW_CONFIRM_MESSAGE;
}

export function resetReplyDraftStore(): void {
  drafts.clear();
  notify();
}
