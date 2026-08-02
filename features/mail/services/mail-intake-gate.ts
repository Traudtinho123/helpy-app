import { parseEmailFrom, isPlaceholderSenderLabel } from "@/features/gmail/services/parse-from-header";
import {
  detectSystemMail,
  type SystemMailDetectionResult,
} from "@/features/mail/services/system-mail-detector";
import {
  hasCustomerInquirySignals,
  isClearlyNonServiceSender,
  isNonServiceInquiry,
} from "@/features/spam-handling/services/spam-detection";
import type { MailVorgangClassification } from "@/features/mail/services/mail-vorgang-classifier";

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
  reason: string;
  systemMail: SystemMailDetectionResult | null;
  classification: MailVorgangClassification | null;
};

function isPersonalInquirySender(fromHeader: string): boolean {
  const parsed = parseEmailFrom(fromHeader);
  if (!parsed.email) return false;
  if (isClearlyNonServiceSender(fromHeader)) return false;
  if (/noreply|no-reply|donotreply|mailer-daemon|notification/i.test(parsed.email)) {
    return false;
  }
  return true;
}

/**
 * Striktes Intake-Gate: Standard ist KEIN Vorgang.
 * Nur echte Kundenanfragen mit erkennbarem Absender passieren.
 */
export function evaluateMailIntake(input: MailIntakeInput): MailIntakeDecision {
  const systemMail = detectSystemMail(input);
  if (systemMail.isSystemMail) {
    return {
      shouldCreateVorgang: false,
      reason: systemMail.reason,
      systemMail,
      classification: null,
    };
  }

  const combined = `${input.subject} ${input.from} ${input.snippet ?? ""} ${input.bodyPreview ?? ""}`;
  const parsed = parseEmailFrom(input.from);

  if (
    isPlaceholderSenderLabel(parsed.name) ||
    parsed.name.toLowerCase() === "kein absender"
  ) {
    return {
      shouldCreateVorgang: false,
      reason: "System-Absender ohne echte Person",
      systemMail: {
        isSystemMail: true,
        category: "system_transaction",
        reason: "Absender ist System/Platzhalter",
      },
      classification: null,
    };
  }

  if (!parsed.email) {
    return {
      shouldCreateVorgang: false,
      reason: "Kein Absender erkennbar — kein Vorgang",
      systemMail: {
        isSystemMail: true,
        category: "system_transaction",
        reason: "Absender-Header fehlt oder unparsebar",
      },
      classification: null,
    };
  }

  if (!isPersonalInquirySender(input.from)) {
    return {
      shouldCreateVorgang: false,
      reason: "System- oder Massenmail-Absender",
      systemMail: {
        isSystemMail: true,
        category: "system_transaction",
        reason: "Nicht-antwortbarer Absender",
      },
      classification: null,
    };
  }

  if (
    isNonServiceInquiry({
      titel: input.subject,
      snippet: input.snippet,
      summary: input.bodyPreview,
      from: input.from,
    })
  ) {
    return {
      shouldCreateVorgang: false,
      reason: "Spam, Newsletter oder automatische Benachrichtigung",
      systemMail: {
        isSystemMail: true,
        category: "newsletter",
        reason: "Keine Dienstleistungsanfrage",
      },
      classification: null,
    };
  }

  if (!hasCustomerInquirySignals(combined)) {
    return {
      shouldCreateVorgang: false,
      reason: "Keine Kundenanfrage erkannt — im Zweifel kein Vorgang",
      systemMail: {
        isSystemMail: true,
        category: "newsletter",
        reason: "Kein Anfrage-Signal im Betreff/Inhalt",
      },
      classification: null,
    };
  }

  return {
    shouldCreateVorgang: true,
    reason: "Echte Kundenanfrage erkannt",
    systemMail: null,
    classification: null,
  };
}

export function applyClassificationGate(
  decision: MailIntakeDecision,
  classification: MailVorgangClassification | null
): MailIntakeDecision {
  if (!decision.shouldCreateVorgang) {
    return { ...decision, classification };
  }

  if (!classification) {
    return {
      shouldCreateVorgang: false,
      reason: "KI-Klassifikation nicht verfügbar — kein Vorgang",
      systemMail: {
        isSystemMail: true,
        category: "system_transaction",
        reason: "KI-Klassifikation fehlt",
      },
      classification: null,
    };
  }

  if (classification.ist_vorgang !== true) {
    return {
      shouldCreateVorgang: false,
      reason: classification.grund || "KI: Kein Vorgang",
      systemMail: {
        isSystemMail: true,
        category:
          classification.kategorie === "newsletter" ||
          classification.kategorie === "spam"
            ? "newsletter"
            : "system_transaction",
        reason: classification.grund || "KI-Klassifikation",
      },
      classification,
    };
  }

  return {
    ...decision,
    classification,
  };
}
