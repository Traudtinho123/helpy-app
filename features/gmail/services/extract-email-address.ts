import { buildFromHeader, parseFrom } from "@/features/gmail/services/parse-from-header";
import { isNonReplyableSystemSender } from "@/features/mail/services/system-mail-detector";

export const RECIPIENT_UNKNOWN_MESSAGE =
  "Empfänger konnte nicht eindeutig erkannt werden.";

export const SYSTEM_MAIL_NO_REPLY_MESSAGE =
  "System-Mail – keine Antwort möglich";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim());
}

/**
 * Extrahiert die E-Mail-Adresse aus einem From-Header.
 *
 * Beispiele:
 * - "Thomas Müller <thomas@firma.ch>" → thomas@firma.ch
 * - "info@firma.ch" → info@firma.ch
 */
export function extractEmailAddress(fromHeader: string): string | null {
  const parsed = parseFrom(fromHeader);
  return parsed.email || null;
}

export function extractSenderNameFromHeader(fromHeader: string): string {
  const parsed = parseFrom(fromHeader);
  if (parsed.email) {
    return parsed.name || parsed.email;
  }
  return parsed.name || fromHeader.trim();
}

export function formatRecipientDisplay(fromHeader: string): string {
  const parsed = parseFrom(fromHeader);
  if (!parsed.email) {
    return fromHeader.trim() || "—";
  }
  return buildFromHeader(parsed.name, parsed.email);
}

export function resolveReplyRecipient(
  fromHeader: string,
  replyToHeader?: string
): {
  display: string;
  email: string | null;
  isValid: boolean;
  isSystemMail: boolean;
  blockedReason: string | null;
} {
  const replyTarget = replyToHeader?.trim() || fromHeader;
  const parsed = parseFrom(replyTarget);
  const email = parsed.email || null;
  const isSystemMail = isNonReplyableSystemSender(fromHeader) ||
    (email ? isNonReplyableSystemSender(buildFromHeader(parsed.name, email)) : false);

  if (isSystemMail) {
    return {
      display: formatRecipientDisplay(fromHeader),
      email,
      isValid: false,
      isSystemMail: true,
      blockedReason: SYSTEM_MAIL_NO_REPLY_MESSAGE,
    };
  }

  return {
    display: formatRecipientDisplay(replyTarget),
    email,
    isValid: Boolean(email),
    isSystemMail: false,
    blockedReason: email ? null : RECIPIENT_UNKNOWN_MESSAGE,
  };
}

export function isBlockedOwnEmailRecipient(
  recipientEmail: string,
  ownEmail: string | null | undefined,
  originalFromHeader: string
): boolean {
  if (!ownEmail?.trim()) return false;

  const normalizedOwn = normalizeEmail(ownEmail);
  const normalizedRecipient = normalizeEmail(recipientEmail);

  if (normalizedRecipient !== normalizedOwn) return false;

  const originalEmail = extractEmailAddress(originalFromHeader);
  return originalEmail !== normalizedOwn;
}

export { parseFrom, buildFromHeader };
