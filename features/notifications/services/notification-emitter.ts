import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import {
  extractSenderName,
} from "@/features/brain/services/brain-result-to-vorgang";
import { getCustomerProfileByEmail } from "@/features/memory/services/customer-memory-store";
import { findCrmCustomerByMatch } from "@/features/crm/services/crm-store";
import { NOTIFICATION_KIND_LABELS } from "@/features/notifications/types/notification-types";
import type {
  HelpyNotification,
  HelpyNotificationKind,
  HelpyNotificationPriority,
} from "@/features/notifications/types/notification-types";
import { resolveNotificationPriority } from "@/features/notifications/types/notification-types";
import type { FollowUp } from "@/features/followup/types/followup-types";
import { pushNotification } from "@/features/notifications/services/notification-store";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import { getWorkspacePath } from "@/features/workspace/services/workspace";
import type { VoiceProcessedCall } from "@/features/voice/types/voice-types";
import { VOICE_CALL_CLASSIFICATION_LABELS } from "@/features/voice/types/voice-types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

function extractSenderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim();
  return from.includes("@") ? from.trim() : "";
}

function buildNotification(input: {
  kind: HelpyNotificationKind;
  vorgangId: string;
  message: string;
  createdAt?: string;
  priority?: HelpyNotificationPriority;
  title?: string;
}): HelpyNotification {
  const kind = input.kind;
  return {
    id: `${kind}-${input.vorgangId}-${input.createdAt ?? Date.now()}`,
    kind,
    title: input.title ?? NOTIFICATION_KIND_LABELS[kind],
    message: input.message,
    vorgangId: input.vorgangId,
    href: getWorkspacePath(input.vorgangId),
    createdAt: input.createdAt ?? new Date().toISOString(),
    read: false,
    priority: resolveNotificationPriority(kind, input.priority),
  };
}

function isConstructionSkill(vorgang: Vorgang): boolean {
  return (
    vorgang.skill === "construction" ||
    vorgang.skillLabel?.includes("Construction") === true
  );
}

function isRealEstateSkill(vorgang: Vorgang): boolean {
  return (
    vorgang.skill === "real-estate" ||
    vorgang.skillLabel?.includes("Real Estate") === true
  );
}

function isHighPriority(vorgang: Vorgang): boolean {
  return vorgang.prioritaet === "hoch" || vorgang.prioritaet === "kritisch";
}

function classifyVorgangNotification(
  vorgang: Vorgang,
  isNewCustomer: boolean
): HelpyNotificationKind | null {
  if (shouldPrepareArchive(vorgang)) {
    return null;
  }

  if (isHighPriority(vorgang)) {
    return "vorgang_prioritaet_hoch";
  }

  const intentHaystack = [vorgang.intent, vorgang.intentLabel, vorgang.typ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    vorgang.typ === "terminwunsch" ||
    intentHaystack.includes("termin") ||
    intentHaystack.includes("besichtigung")
  ) {
    return "besichtigungsanfrage";
  }

  if (isNewCustomer || vorgang.typ === "neuer_kunde") {
    return "neuer_interessent";
  }

  if (
    vorgang.typ === "angebotsanfrage" ||
    intentHaystack.includes("angebot") ||
    intentHaystack.includes("offert")
  ) {
    return "angebot_vorbereitet";
  }

  if (isConstructionSkill(vorgang)) {
    return "baustellen_anfrage";
  }

  if (
    isRealEstateSkill(vorgang) ||
    vorgang.typ === "anfrage" ||
    intentHaystack.includes("immobilien")
  ) {
    return "anfrage";
  }

  if (intentHaystack.includes("neue anfrage")) {
    return isConstructionSkill(vorgang)
      ? "baustellen_anfrage"
      : "anfrage";
  }

  return null;
}

function buildVorgangMessage(vorgang: Vorgang): string {
  const customer = vorgang.kunde || extractSenderName(vorgang.from ?? "");
  const subject = vorgang.titel;
  return customer ? `${customer} · ${subject}` : subject;
}

export function notifyFromGmailVorgang(
  vorgang: Vorgang,
  options?: { isNewCustomer?: boolean; createdAt?: string }
): void {
  const from = vorgang.from ?? vorgang.kunde;
  const email = extractSenderEmail(from);
  const hadProfile = email
    ? Boolean(findCrmCustomerByMatch({ email }) ?? getCustomerProfileByEmail(email))
    : false;
  const isNewCustomer = options?.isNewCustomer ?? !hadProfile;

  const kind = classifyVorgangNotification(vorgang, isNewCustomer);
  if (!kind) return;

  pushNotification(
    buildNotification({
      kind,
      vorgangId: vorgang.id,
      message: buildVorgangMessage(vorgang),
      createdAt: options?.createdAt ?? vorgang.receivedAt,
    })
  );
}

export function notifyFromGmailVorgangBundles(bundles: GmailVorgangBundle[]): void {
  for (const bundle of bundles) {
    const from =
      bundle.brain.from ||
      bundle.message.from ||
      bundle.liste.from ||
      bundle.liste.kunde;

    const email = extractSenderEmail(from);
    const isNewCustomer = email
      ? !findCrmCustomerByMatch({ email })
      : false;

    notifyFromGmailVorgang(bundle.liste, {
      isNewCustomer,
      createdAt: bundle.liste.receivedAt,
    });
  }
}

export function notifyMailProcessed(count: number): void {
  if (count <= 0) return;

  pushNotification({
    id: `mail_verarbeitet-${Date.now()}`,
    kind: "mail_verarbeitet",
    title: NOTIFICATION_KIND_LABELS.mail_verarbeitet,
    message:
      count === 1
        ? "1 neue Mail wurde verarbeitet"
        : `${count} neue Mails wurden verarbeitet`,
    href: "/vorgaenge",
    createdAt: new Date().toISOString(),
    read: false,
    priority: "normal",
  });
}

export function notifyCalendarSynced(calendarName?: string): void {
  pushNotification({
    id: `kalender_sync-${Date.now()}`,
    kind: "kalender_sync",
    title: NOTIFICATION_KIND_LABELS.kalender_sync,
    message: calendarName
      ? `${calendarName} wurde synchronisiert`
      : "Kalender wurde synchronisiert",
    href: "/kalender",
    createdAt: new Date().toISOString(),
    read: false,
    priority: "normal",
  });
}

export function notifyWeeklyReportReady(): void {
  pushNotification({
    id: `weekly_report-${Date.now()}`,
    kind: "weekly_report",
    title: NOTIFICATION_KIND_LABELS.weekly_report,
    message: "Dein Wochenbericht ist bereit",
    href: "/einstellungen/analytics",
    createdAt: new Date().toISOString(),
    read: false,
    priority: "normal",
  });
}

export function notifyGmailDraftSaved(vorgang: Vorgang): void {
  pushNotification(
    buildNotification({
      kind: "gmail_entwurf",
      vorgangId: vorgang.id,
      message: buildVorgangMessage(vorgang),
      priority: "normal",
    })
  );
}

export function notifyGmailSent(vorgang: Vorgang): void {
  pushNotification({
    ...buildNotification({
      kind: "gmail_gesendet",
      vorgangId: vorgang.id,
      message: buildVorgangMessage(vorgang),
      priority: "normal",
    }),
    id: `gmail_gesendet-${vorgang.id}-${Date.now()}`,
  });
}

export function notifyFollowUpKundeWartet(
  followUp: FollowUp,
  hours = 24
): void {
  pushNotification({
    ...buildNotification({
      kind: "vorgang_wartet_24h",
      vorgangId: followUp.vorgangId,
      message: `Wartet seit ${hours} Stunden auf Antwort`,
      priority: "wichtig",
    }),
    id: `vorgang_wartet_24h-${followUp.vorgangId}-${hours}`,
    href: followUp.href,
  });
}

export function notifyVoiceIntake(processed: VoiceProcessedCall): void {
  const classification = processed.classification ?? "sonstiges";
  const kind =
    classification === "notfall"
      ? "voice_notfall"
      : "voice_anruf";

  const caller =
    processed.callerName?.trim() ||
    processed.call.callerPhone?.trim() ||
    processed.liste.kunde;

  const label =
    VOICE_CALL_CLASSIFICATION_LABELS[classification] ??
    processed.liste.intentLabel ??
    "Telefonanruf";

  pushNotification({
    ...buildNotification({
      kind,
      vorgangId: processed.vorgangId,
      message: caller ? `${caller} · ${label}` : label,
      createdAt: processed.liste.receivedAt,
      priority: "wichtig",
    }),
    id: `${kind}-${processed.vorgangId}-${Date.now()}`,
  });
}

export function notifyFollowUpAngebotOffen(followUp: FollowUp): void {
  pushNotification({
    ...buildNotification({
      kind: "angebot_vorbereitet",
      vorgangId: followUp.vorgangId,
      message: "Angebot seit 7 Tagen offen.",
      priority: "normal",
    }),
    id: `followup_angebot_offen-${followUp.vorgangId}-7`,
    href: followUp.href,
  });
}

export function notifyUpcomingAppointment(input: {
  vorgangId: string;
  title: string;
  message: string;
}): void {
  pushNotification({
    id: `termin_bald-${input.vorgangId}-${Date.now()}`,
    kind: "termin_bald",
    title: NOTIFICATION_KIND_LABELS.termin_bald,
    message: input.message,
    vorgangId: input.vorgangId,
    href: getWorkspacePath(input.vorgangId),
    createdAt: new Date().toISOString(),
    read: false,
    priority: "wichtig",
  });
}
