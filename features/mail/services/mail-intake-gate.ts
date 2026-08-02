import { parseEmailFrom, isPlaceholderSenderLabel } from "@/features/gmail/services/parse-from-header";
import {
  detectSystemMail,
  type SystemMailDetectionResult,
} from "@/features/mail/services/system-mail-detector";
import type { MailVorgangClassification } from "@/features/mail/services/mail-vorgang-classifier";
import {
  inferArchiveCategoryFromText,
  isArchiveMailCategory,
  mapMailCategoryToArchiveCategory,
  type VorgangArchiveCategory,
  type VorgangMailCategory,
} from "@/features/mail/services/vorgang-classification-types";
import {
  hasCustomerInquirySignals,
  isClearlyNonServiceSender,
  isNonServiceInquiry,
} from "@/features/spam-handling/services/spam-detection";

export type MailIntakeInput = {
  from: string;
  subject: string;
  snippet?: string;
  bodyPreview?: string;
  replyTo?: string;
  listUnsubscribe?: string;
  precedence?: string;
  xMailer?: string;
  sourceAccountEmail?: string | null;
  direction?: "incoming" | "outgoing";
};

export type MailIntakeDecision = {
  shouldCreateVorgang: boolean;
  shouldArchive: boolean;
  archiveCategory: VorgangArchiveCategory | null;
  reason: string;
  systemMail: SystemMailDetectionResult | null;
  classification: MailVorgangClassification | null;
};

const HELPY_NEWSLETTER_HINTS = [
  "werbe- oder newsletter",
  "newsletter-nachricht",
  "xing news",
  "wirtschaft & management",
  "wirtschaft und management",
] as const;

function hasHelpyNewsletterHint(text: string): boolean {
  const normalized = text.toLowerCase();
  return HELPY_NEWSLETTER_HINTS.some((hint) => normalized.includes(hint));
}

function isPersonalInquirySender(fromHeader: string): boolean {
  const parsed = parseEmailFrom(fromHeader);
  if (!parsed.email) return false;
  if (isClearlyNonServiceSender(fromHeader)) return false;
  if (/noreply|no-reply|donotreply|mailer-daemon|notification/i.test(parsed.email)) {
    return false;
  }
  return true;
}

function archiveDecision(
  reason: string,
  category: VorgangArchiveCategory,
  systemMail: SystemMailDetectionResult | null = null,
  classification: MailVorgangClassification | null = null
): MailIntakeDecision {
  return {
    shouldCreateVorgang: false,
    shouldArchive: true,
    archiveCategory: category,
    reason,
    systemMail,
    classification,
  };
}

function customerDecision(
  reason: string,
  classification: MailVorgangClassification | null = null
): MailIntakeDecision {
  return {
    shouldCreateVorgang: true,
    shouldArchive: false,
    archiveCategory: null,
    reason,
    systemMail: null,
    classification,
  };
}

/** Sofort-Filter ohne KI — erkennt offensichtliche Archiv-Mails. */
export function evaluateInstantArchiveFilter(
  input: MailIntakeInput
): MailIntakeDecision | null {
  const systemMail = detectSystemMail(input);
  if (systemMail.isSystemMail) {
    const category =
      systemMail.category === "newsletter"
        ? "newsletter"
        : systemMail.category === "verification"
          ? "system"
          : "system";
    return archiveDecision(systemMail.reason, category, systemMail);
  }

  if (input.listUnsubscribe?.trim()) {
    return archiveDecision(
      "List-Unsubscribe Header erkannt",
      "newsletter",
      {
        isSystemMail: true,
        category: "newsletter",
        reason: "Newsletter-Header",
      }
    );
  }

  const combined = `${input.subject} ${input.from} ${input.snippet ?? ""} ${input.bodyPreview ?? ""}`;

  if (hasHelpyNewsletterHint(combined)) {
    return archiveDecision("Newsletter/Werbung erkannt (HELPY-Hinweis)", "newsletter");
  }

  const parsed = parseEmailFrom(input.from);

  if (
    isPlaceholderSenderLabel(parsed.name) ||
    parsed.name.toLowerCase() === "kein absender"
  ) {
    return archiveDecision("System-Absender ohne echte Person", "system");
  }

  if (!parsed.email) {
    return archiveDecision("Kein Absender erkennbar", "system");
  }

  if (!isPersonalInquirySender(input.from)) {
    return archiveDecision("System- oder Massenmail-Absender", "system");
  }

  if (
    isNonServiceInquiry({
      titel: input.subject,
      snippet: input.snippet,
      summary: input.bodyPreview,
      from: input.from,
    })
  ) {
    return archiveDecision(
      "Spam, Newsletter oder automatische Benachrichtigung",
      inferArchiveCategoryFromText({
        from: input.from,
        subject: input.subject,
        snippet: input.snippet ?? input.bodyPreview,
      })
    );
  }

  return null;
}

/**
 * Mail-Intake: Archiv-Mails werden markiert, echte Anfragen passieren zum KI-Schritt.
 */
export function evaluateMailIntake(input: MailIntakeInput): MailIntakeDecision {
  const instant = evaluateInstantArchiveFilter(input);
  if (instant) return instant;

  const combined = `${input.subject} ${input.from} ${input.snippet ?? ""} ${input.bodyPreview ?? ""}`;

  if (!hasCustomerInquirySignals(combined)) {
    return archiveDecision(
      "Keine Kundenanfrage erkannt — im Zweifel archivieren",
      inferArchiveCategoryFromText({
        from: input.from,
        subject: input.subject,
        snippet: input.snippet ?? input.bodyPreview,
      })
    );
  }

  return customerDecision("Echte Kundenanfrage erkannt — KI-Klassifikation folgt");
}

export function applyClassificationGate(
  decision: MailIntakeDecision,
  classification: MailVorgangClassification | null
): MailIntakeDecision {
  if (decision.shouldArchive) {
    return { ...decision, classification };
  }

  if (!classification) {
    return archiveDecision("KI-Klassifikation nicht verfügbar — archiviert", "system");
  }

  const istEcht = classification.ist_echter_vorgang ?? classification.ist_vorgang;

  if (!istEcht) {
    const mailCategory = classification.kategorie as VorgangMailCategory;
    const archiveCategory = isArchiveMailCategory(mailCategory)
      ? mapMailCategoryToArchiveCategory(mailCategory)
      : inferArchiveCategoryFromText({
          from: "",
          subject: "",
          snippet: classification.grund,
        });

    return archiveDecision(
      classification.grund || "KI: Kein echter Vorgang",
      archiveCategory,
      {
        isSystemMail: true,
        category: "newsletter",
        reason: classification.grund || "KI-Klassifikation",
      },
      classification
    );
  }

  return customerDecision(classification.grund || "KI: Echter Vorgang", classification);
}
