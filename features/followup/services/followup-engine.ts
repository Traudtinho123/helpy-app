import { buildCustomerIdFromEmail } from "@/features/memory/services/customer-memory-store";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import {
  notifyFollowUpAngebotOffen,
  notifyFollowUpKundeWartet,
} from "@/features/notifications/services/notification-emitter";
import {
  computeDaysWithoutAnswer,
  deriveFollowUpPreparedAction,
  deriveFollowUpRecommendation,
  deriveFollowUpStatus,
  isAngebotsFollowUp,
} from "@/features/followup/services/followup-rules";
import {
  getAllFollowUps,
  peekFollowUpByVorgangId,
  upsertFollowUp,
} from "@/features/followup/services/followup-store";
import {
  recordFollowUpClosed,
  recordFollowUpStarted,
  recordFollowUpStepRecommended,
} from "@/features/followup/services/followup-timeline";
import type {
  FollowUp,
  FollowUpPreparedActionKind,
  FollowUpStatus,
} from "@/features/followup/types/followup-types";
import { getWorkspacePath } from "@/features/workspace/services/workspace";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

function extractSenderEmail(from?: string): string | null {
  if (!from) return null;
  return extractEmailAddress(from);
}

function resolveCustomerId(vorgang: Vorgang): string {
  if (vorgang.kundenAkteId) return vorgang.kundenAkteId;
  const email = extractSenderEmail(vorgang.from);
  if (email) return buildCustomerIdFromEmail(email);
  return `customer-${vorgang.id}`;
}

function buildFollowUpId(vorgangId: string): string {
  return `followup-${vorgangId}`;
}

function evaluateFollowUpRecord(
  record: FollowUp,
  now = new Date()
): FollowUp {
  const daysWithoutAnswer = computeDaysWithoutAnswer(record.lastOutgoingMail, now);
  const status = deriveFollowUpStatus(daysWithoutAnswer, record.status);
  const recommendation = deriveFollowUpRecommendation(status, daysWithoutAnswer);
  const preparedAction = deriveFollowUpPreparedAction(status, daysWithoutAnswer);

  return {
    ...record,
    daysWithoutAnswer,
    status,
    recommendation,
    preparedAction,
  };
}

function syncFollowUpNotifications(record: FollowUp): FollowUp {
  let next = { ...record };

  if (
    next.status !== "abgeschlossen" &&
    next.daysWithoutAnswer >= 3 &&
    !next.notifiedAt3Days
  ) {
    notifyFollowUpKundeWartet(next);
    next = { ...next, notifiedAt3Days: true };
  }

  if (
    next.status !== "abgeschlossen" &&
    next.daysWithoutAnswer >= 7 &&
    !next.notifiedAt7Days
  ) {
    if (isAngebotsFollowUp(next.vorgangTyp)) {
      notifyFollowUpAngebotOffen(next);
    } else {
      notifyFollowUpKundeWartet(next, 7);
    }
    next = { ...next, notifiedAt7Days: true };
  }

  return next;
}

export function startFollowUpFromGmailSend(
  vorgang: Vorgang,
  sentAt = new Date().toISOString()
): FollowUp {
  const existing = peekFollowUpByVorgangId(vorgang.id);
  if (existing?.status === "abgeschlossen") {
    return existing;
  }

  const base: FollowUp = {
    id: buildFollowUpId(vorgang.id),
    vorgangId: vorgang.id,
    customerId: resolveCustomerId(vorgang),
    customerName: vorgang.kunde,
    vorgangTitel: vorgang.titel,
    vorgangTyp: vorgang.typ,
    lastOutgoingMail: sentAt,
    lastIncomingMail: vorgang.receivedAt ?? vorgang.emailDate ?? null,
    daysWithoutAnswer: 0,
    status: "warten",
    recommendation: "Warten auf Antwort.",
    preparedAction: null,
    notifiedAt3Days: false,
    notifiedAt7Days: false,
    href: vorgang.href ?? getWorkspacePath(vorgang.id),
  };

  const evaluated = evaluateFollowUpRecord(base);
  upsertFollowUp(evaluated);
  recordFollowUpStarted({
    followUpId: evaluated.id,
    vorgangId: evaluated.vorgangId,
    customerName: evaluated.customerName,
  });

  return evaluated;
}

export function refreshFollowUp(vorgangId: string, now = new Date()): FollowUp | null {
  const existing = peekFollowUpByVorgangId(vorgangId);
  if (!existing || existing.status === "abgeschlossen") {
    return existing ? { ...existing } : null;
  }

  const previousActionKind = existing.preparedAction?.kind ?? null;
  let evaluated = evaluateFollowUpRecord(existing, now);
  evaluated = syncFollowUpNotifications(evaluated);

  if (
    evaluated.preparedAction &&
    evaluated.preparedAction.kind !== previousActionKind
  ) {
    recordFollowUpStepRecommended({
      followUpId: evaluated.id,
      vorgangId: evaluated.vorgangId,
      recommendation: evaluated.recommendation,
      preparedActionLabel: evaluated.preparedAction.label,
    });
  }

  upsertFollowUp(evaluated);
  return evaluated;
}

export function refreshAllFollowUps(now = new Date()): void {
  for (const record of getAllFollowUps()) {
    if (record.status !== "abgeschlossen") {
      refreshFollowUp(record.vorgangId, now);
    }
  }
}

export function markFollowUpAbgeschlossen(vorgangId: string): FollowUp | null {
  const existing = peekFollowUpByVorgangId(vorgangId);
  if (!existing) return null;

  const closed: FollowUp = {
    ...existing,
    status: "abgeschlossen",
    recommendation: "Follow-up abgeschlossen.",
    preparedAction: null,
  };

  upsertFollowUp(closed);
  recordFollowUpClosed({
    followUpId: closed.id,
    vorgangId: closed.vorgangId,
  });

  return closed;
}

export function getFollowUpActionFeedback(
  kind: FollowUpPreparedActionKind
): string {
  switch (kind) {
    case "nachfrage_pruefen":
      return "Freundliche Nachfrage zur Prüfung vorbereitet. Nichts wurde automatisch versendet.";
    case "anruf_planen":
      return "Anrufplanung zur Prüfung vorbereitet. Nichts wurde automatisch ausgeführt.";
    case "vorgang_abschliessen":
      return "Vorgang zur Prüfung abgeschlossen. Nichts wurde automatisch geändert.";
  }
}

export function getFollowUpStatusLabel(status: FollowUpStatus): string {
  switch (status) {
    case "warten":
      return "Warten";
    case "erinnerung":
      return "Erinnerung";
    case "dringend":
      return "Dringend";
    case "abgeschlossen":
      return "Abgeschlossen";
  }
}

export function formatFollowUpContactDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export const HELPY_FOLLOWUP_MONITORING_MESSAGE =
  "Ich überwache offene Kundenkommunikation und erinnere dich nur, wenn eine Aktion sinnvoll ist.";
