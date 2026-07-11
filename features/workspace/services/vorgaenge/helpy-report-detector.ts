import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

/** Universelle Erkennungs-Marke für HELPY-System-Mails. */
export const HELPY_MAIL_SUBJECT_PREFIX = "[HELPY]";

/** Bekannte Absender-Domains für HELPY-System-Mails. */
export const HELPY_SYSTEM_EMAIL_DOMAINS = [
  "helpy.ai",
  "gethelpy.com",
  "mail.helpy.ai",
  "notifications.helpy.ai",
] as const;

const HELPY_SELF_SENT_SUBJECT_PATTERN =
  /\bhelpy\b|wochenzusammenfassung|wochenbericht|benachrichtigung/i;

export type HelpyMailDetectionInput = {
  subject: string;
  from: string;
  sourceAccountEmail?: string | null;
};

export function isHelpyReportVorgang(
  vorgang: Pick<Vorgang, "typ">
): vorgang is Vorgang & { typ: "helpy_report" } {
  return vorgang.typ === "helpy_report";
}

export function isHelpySystemMail(input: HelpyMailDetectionInput): boolean {
  const subject = input.subject.trim();
  if (!subject) return false;

  if (subject.includes(HELPY_MAIL_SUBJECT_PREFIX)) {
    return true;
  }

  const fromEmail = extractEmailAddress(input.from)?.toLowerCase() ?? null;
  if (
    fromEmail &&
    HELPY_SYSTEM_EMAIL_DOMAINS.some(
      (domain) => fromEmail === domain || fromEmail.endsWith(`@${domain}`)
    )
  ) {
    return true;
  }

  const ownEmail = input.sourceAccountEmail?.trim().toLowerCase() ?? null;
  if (
    fromEmail &&
    ownEmail &&
    fromEmail === ownEmail &&
    HELPY_SELF_SENT_SUBJECT_PATTERN.test(subject)
  ) {
    return true;
  }

  return false;
}

export function isHelpySystemUnifiedMail(message: UnifiedMailMessage): boolean {
  return isHelpySystemMail({
    subject: message.subject,
    from: message.from,
    sourceAccountEmail: message.sourceAccountEmail,
  });
}

export function stripHelpySubjectPrefix(subject: string): string {
  return subject.replace(/^\[HELPY\]\s*/i, "").trim();
}

export function resolveHelpyReportLabel(subject: string): string {
  const normalized = stripHelpySubjectPrefix(subject).toLowerCase();

  if (normalized.includes("wochenzusammenfassung") || normalized.includes("wochenbericht")) {
    return "Wochenbericht";
  }

  if (normalized.includes("benachrichtigung")) {
    return "Benachrichtigung";
  }

  return "HELPY Report";
}
