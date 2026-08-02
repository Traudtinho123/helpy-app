import { parseEmailFrom } from "@/features/gmail/services/parse-from-header";
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
  "github.dev",
  "gitlab.com",
  "circleci.com",
  "netlify.com",
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
  "mediamarkt.ch",
  "mediamarkt.de",
  "galaxus.ch",
  "digitec.ch",
  "linkedin.com",
  "xing.com",
  "xing.de",
  "news.xing.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "amazon.com",
  "amazon.de",
  "ebay.com",
  "ebay.de",
  "zalando.ch",
  "zalando.de",
  "spotify.com",
  "netflix.com",
  "check24.de",
  "booking.com",
  "airbnb.com",
  "migros.ch",
  "coop.ch",
  "lidl.ch",
  "lidl.de",
  "powerpay.ch",
  "powerpay.de",
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
  "newsletter",
  "marketing",
  "promo",
  "info",
  "news",
  "updates",
  "alert",
  "alerts",
  "security",
  "account",
  "accounts",
  "support",
  "hello",
  "team",
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
  "login",
  "log in",
  "sign in",
  "new device",
  "neues gerät",
  "neues geraet",
  "device login",
  "passcode",
  "authentication",
  "authentifizierung",
] as const;

const MARKETING_SUBJECT_KEYWORDS = [
  "newsletter",
  "angebot",
  "sale",
  "rabatt",
  "promo",
  "aktion",
  "deal",
  "unschlagbar",
  "powerpay",
  "mediamarkt",
  "black friday",
  "cyber monday",
  "gratis",
  "kostenlos",
  "exklusiv",
  "nur heute",
  "limited",
  "digest",
  "weekly",
  "wöchentlich",
  "woechentlich",
  "update",
  "neuigkeiten",
  "unsubscribe",
  "abmelden",
  "essai",
  "trial",
  "bienvenue",
  "welcome",
  "willkommen",
  "finále",
  "finale",
  "startet",
  "live",
  "gewinn",
  "gewinnen",
  "❤",
  "💥",
  "🔥",
  "sommers",
  "uhr des",
  "fernseher",
  "developer account",
  "your developer",
  "failed production",
  "deployment failed",
  "build failed",
  "production deploy",
  "stell alles auf den kopf",
  "urlaubsfavoriten",
  "strandlage",
  "urlaub",
  "reise",
  "reisen",
  "hotel",
  "flug",
  "🌴",
  "rekordschulden",
  "haushaltshelfer",
  "eingetroffen",
  "nur noch bis morgen",
  "bis morgen",
  "jira",
  "asana",
  "pipefy",
  "bmw",
  "krise",
  "clevere",
  "✨",
  "xing news",
  "wirtschaft & management",
  "wirtschaft und management",
] as const;

const AUTO_NOTIFICATION_SUBJECT_KEYWORDS = [
  "notification",
  "benachrichtigung",
  "alert",
  "reminder",
  "erinnerung",
  "account is ready",
  "account ready",
  "konto ist bereit",
  "is ready",
  "ist bereit",
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
  "salesforce",
  "emarsys",
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

function containsAny(text: string, keywords: readonly string[]): boolean {
  const normalized = normalizeText(text);
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
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
  const email = parseEmailFrom(fromHeader).email || null;
  if (!email) return false;
  return isNoreplyAddress(email) || isKnownSystemDomain(email);
}

function isVerificationMail(input: SystemMailDetectionInput): boolean {
  const haystack = `${input.subject} ${input.snippet ?? ""} ${input.bodyPreview ?? ""}`;
  return containsAny(haystack, VERIFICATION_SUBJECT_KEYWORDS);
}

function hasPercentDiscountSubject(subject: string): boolean {
  return /^\s*\d+\s*%/i.test(subject.trim()) || /\d+\s*%\s*rabatt/i.test(subject);
}

function isMarketingSubject(input: SystemMailDetectionInput): boolean {
  const haystack = `${input.subject} ${input.snippet ?? ""} ${input.bodyPreview ?? ""}`;
  return (
    containsAny(haystack, MARKETING_SUBJECT_KEYWORDS) ||
    containsAny(haystack, AUTO_NOTIFICATION_SUBJECT_KEYWORDS) ||
    hasPercentDiscountSubject(input.subject)
  );
}

function isNewsletterMail(input: SystemMailDetectionInput): boolean {
  if (input.listUnsubscribe?.trim()) return true;
  if (normalizeText(input.precedence ?? "") === "bulk") return true;

  const xMailer = normalizeText(input.xMailer ?? "");
  if (xMailer && NEWSLETTER_X_MAILER_HINTS.some((hint) => xMailer.includes(hint))) {
    return true;
  }

  return isMarketingSubject(input);
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
  const parsed = parseEmailFrom(input.from);
  const fromEmail = parsed.email || null;

  if (isOwnSentMail(input, fromEmail)) {
    return {
      isSystemMail: true,
      category: "own_sent",
      reason: "Eigene gesendete Mail",
    };
  }

  if (isVerificationMail(input)) {
    return {
      isSystemMail: true,
      category: "verification",
      reason: "Verifizierungs-, Login- oder Code-Mail",
    };
  }

  if (isNewsletterMail(input)) {
    return {
      isSystemMail: true,
      category: "newsletter",
      reason: "Newsletter, Werbung oder Marketing-Mail",
    };
  }

  if (fromEmail && (isNoreplyAddress(fromEmail) || isKnownSystemDomain(fromEmail))) {
    return {
      isSystemMail: true,
      category: "system_transaction",
      reason: "System- oder Transaktions-Absender",
    };
  }

  if (!fromEmail && (isVerificationMail(input) || isMarketingSubject(input))) {
    return {
      isSystemMail: true,
      category: "system_transaction",
      reason: "Automatische Mail ohne persönlichen Absender",
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
