import { parseFrom } from "@/features/gmail/services/parse-from-header";
import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";

/** Bekannte System-/Transaktions-Domains — leicht erweiterbar. */
export const SYSTEM_MAIL_DOMAINS = [
  "docusign.com",
  "docusign.net",
  "twilio.com",
  "supabase.com",
  "vercel.com",
  "github.com",
  "google.com",
  "accounts.google.com",
  "apple.com",
  "microsoft.com",
  "stripe.com",
  "paypal.com",
  "post.ch",
  "swisspost.ch",
  "swisscom.ch",
  "ubs.com",
  "credit-suisse.com",
  "raiffeisen.ch",
  "zkb.ch",
] as const;

/** noreply/no-reply Local-Parts. */
export const SYSTEM_MAIL_LOCAL_PARTS = [
  "noreply",
  "no-reply",
  "no_reply",
  "donotreply",
  "do-not-reply",
  "system",
  "mailer-daemon",
  "bounce",
  "notifications",
  "notification",
] as const;

const VERIFICATION_SUBJECT_KEYWORDS = [
  "code",
  "verification",
  "verify",
  "bestätigung",
  "bestaetigung",
  "otp",
  "pin",
  "your code",
  "dein code",
  "2fa",
  "two-factor",
  "security code",
  "sicherheitscode",
] as const;

const NEWSLETTER_X_MAILER_HINTS = [
  "mailchimp",
  "sendgrid",
  "campaign",
  "hubspot",
  "klaviyo",
  "mailjet",
  "constant contact",
  "brevo",
  "sendinblue",
] as const;

export type SystemMailCategory =
  | "verification"
  | "system_transaction"
  | "newsletter"
  | "own_sent"
  | "none";

export type SystemMailDetectionResult = {
  isSystemMail: boolean;
  category: SystemMailCategory;
  reason: string;
};

export type SystemMailDetectionInput = {
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

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function emailLocalPart(email: string): string {
  return email.split("@")[0]?.toLowerCase() ?? "";
}

function emailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

export function isNoreplyAddress(email: string | null | undefined): boolean {
  if (!email) return false;
  const local = emailLocalPart(email);
  return SYSTEM_MAIL_LOCAL_PARTS.some(
    (part) => local === part || local.startsWith(`${part}+`) || local.includes(part)
  );
}

export function isKnownSystemDomain(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = emailDomain(email);
  return SYSTEM_MAIL_DOMAINS.some(
    (known) => domain === known || domain.endsWith(`.${known}`)
  );
}

export function isNonReplyableSystemSender(fromHeader: string): boolean {
  const email = parseFrom(fromHeader).email || null;
  if (!email) return false;
  return isNoreplyAddress(email) || isKnownSystemDomain(email);
}

function isVerificationMail(input: SystemMailDetectionInput, fromEmail: string | null): boolean {
  const subject = normalizeText(input.subject);
  const body = normalizeText(`${input.snippet ?? ""} ${input.bodyPreview ?? ""}`);
  const hasVerificationSubject = VERIFICATION_SUBJECT_KEYWORDS.some((keyword) =>
    subject.includes(keyword)
  );

  if (!hasVerificationSubject) return false;

  const codeOnlyBody = /^(?:your code is|dein code|code:|verification code:)?\s*\d{4,8}\b/i.test(
    body.trim()
  );
  const noreplySender = fromEmail ? isNoreplyAddress(fromEmail) : false;

  return noreplySender || codeOnlyBody || hasVerificationSubject;
}

function isNewsletterMail(input: SystemMailDetectionInput): boolean {
  if (input.listUnsubscribe?.trim()) return true;
  if (normalizeText(input.precedence ?? "") === "bulk") return true;

  const xMailer = normalizeText(input.xMailer ?? "");
  if (xMailer && NEWSLETTER_X_MAILER_HINTS.some((hint) => xMailer.includes(hint))) {
    return true;
  }

  return false;
}

function isOwnSentMail(input: SystemMailDetectionInput, fromEmail: string | null): boolean {
  if (input.direction === "outgoing") return true;

  const ownEmail = input.sourceAccountEmail?.trim().toLowerCase() ?? null;
  if (!ownEmail || !fromEmail) return false;
  return fromEmail === ownEmail;
}

/** Erkennt System-Mails die kein Kunden-Vorgang werden dürfen. */
export function detectSystemMail(
  input: SystemMailDetectionInput
): SystemMailDetectionResult {
  const parsed = parseFrom(input.from);
  const fromEmail = parsed.email || null;

  if (isOwnSentMail(input, fromEmail)) {
    return {
      isSystemMail: true,
      category: "own_sent",
      reason: "Eigene gesendete Mail",
    };
  }

  if (isVerificationMail(input, fromEmail)) {
    return {
      isSystemMail: true,
      category: "verification",
      reason: "Verifizierungs- oder Code-Mail",
    };
  }

  if (fromEmail && (isNoreplyAddress(fromEmail) || isKnownSystemDomain(fromEmail))) {
    return {
      isSystemMail: true,
      category: "system_transaction",
      reason: "System- oder Transaktions-Absender",
    };
  }

  if (isNewsletterMail(input)) {
    return {
      isSystemMail: true,
      category: "newsletter",
      reason: "Newsletter oder Marketing-Mail",
    };
  }

  return {
    isSystemMail: false,
    category: "none",
    reason: "",
  };
}

export function detectSystemMailFromUnified(
  message: UnifiedMailMessage
): SystemMailDetectionResult {
  return detectSystemMail({
    from: message.from,
    subject: message.subject,
    snippet: message.snippet,
    bodyPreview: message.bodyPreview,
    replyTo: message.replyTo,
    listUnsubscribe: message.listUnsubscribe,
    precedence: message.precedence,
    xMailer: message.xMailer,
    sourceAccountEmail: message.sourceAccountEmail,
    direction: message.direction,
  });
}

export function detectSystemMailFromGmail(
  message: GmailConnectorMessage,
  sourceAccountEmail?: string | null
): SystemMailDetectionResult {
  return detectSystemMail({
    from: message.from,
    subject: message.subject,
    snippet: message.snippet,
    replyTo: message.replyTo,
    listUnsubscribe: message.listUnsubscribe,
    precedence: message.precedence,
    xMailer: message.xMailer,
    sourceAccountEmail,
    direction: message.direction,
  });
}

export function resolveSystemMailReportLabel(category: SystemMailCategory): string {
  switch (category) {
    case "verification":
      return "Verifizierung";
    case "system_transaction":
      return "System-Mail";
    case "newsletter":
      return "Newsletter";
    case "own_sent":
      return "Eigene Mail";
    default:
      return "System-Mail";
  }
}
