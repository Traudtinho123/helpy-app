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
} from "@/features/notifications/types/notification-types";
import type { FollowUp } from "@/features/followup/types/followup-types";
import { pushNotification } from "@/features/notifications/services/notification-store";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import { getWorkspacePath } from "@/features/workspace/services/workspace";
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
}): HelpyNotification {
  return {
    id: `${input.kind}-${input.vorgangId}`,
    kind: input.kind,
    title: NOTIFICATION_KIND_LABELS[input.kind],
    message: input.message,
    vorgangId: input.vorgangId,
    href: getWorkspacePath(input.vorgangId),
    createdAt: input.createdAt ?? new Date().toISOString(),
    read: false,
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

function classifyVorgangNotification(
  vorgang: Vorgang,
  isNewCustomer: boolean
): HelpyNotificationKind | null {
  if (shouldPrepareArchive(vorgang)) {
    return "spam_archiv";
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
    return "kalender_termin";
  }

  if (
    vorgang.typ === "angebotsanfrage" ||
    intentHaystack.includes("angebot") ||
    intentHaystack.includes("offert")
  ) {
    return "angebot_vorbereitet";
  }

  if (isNewCustomer || vorgang.typ === "neuer_kunde") {
    return "neuer_kunde";
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

export function notifyGmailDraftSaved(vorgang: Vorgang): void {
  pushNotification(
    buildNotification({
      kind: "gmail_entwurf",
      vorgangId: vorgang.id,
      message: buildVorgangMessage(vorgang),
    })
  );
}

export function notifyGmailSent(vorgang: Vorgang): void {
  pushNotification({
    ...buildNotification({
      kind: "gmail_gesendet",
      vorgangId: vorgang.id,
      message: buildVorgangMessage(vorgang),
    }),
    id: `gmail_gesendet-${vorgang.id}-${Date.now()}`,
  });
}

export function notifyFollowUpKundeWartet(
  followUp: FollowUp,
  days = 3
): void {
  pushNotification({
    ...buildNotification({
      kind: "followup_kunde_wartet",
      vorgangId: followUp.vorgangId,
      message: `Kunde wartet seit ${days} Tagen.`,
    }),
    id: `followup_kunde_wartet-${followUp.vorgangId}-${days}`,
    href: followUp.href,
  });
}

export function notifyFollowUpAngebotOffen(followUp: FollowUp): void {
  pushNotification({
    ...buildNotification({
      kind: "followup_angebot_offen",
      vorgangId: followUp.vorgangId,
      message: "Angebot seit 7 Tagen offen.",
    }),
    id: `followup_angebot_offen-${followUp.vorgangId}-7`,
    href: followUp.href,
  });
}
