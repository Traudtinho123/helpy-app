const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const RECIPIENT_UNKNOWN_MESSAGE =
  "Empfänger konnte nicht eindeutig erkannt werden.";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/**
 * Extrahiert die E-Mail-Adresse aus einem From-Header.
 *
 * Beispiele:
 * - "Thomas Müller <thomas@firma.ch>" → thomas@firma.ch
 * - "info@firma.ch" → info@firma.ch
 */
export function extractEmailAddress(fromHeader: string): string | null {
  if (!fromHeader?.trim()) return null;

  const angleMatch = fromHeader.match(/<([^>]+)>/);
  if (angleMatch?.[1]) {
    const email = angleMatch[1].trim();
    return isValidEmail(email) ? normalizeEmail(email) : null;
  }

  const trimmed = fromHeader.trim();
  if (isValidEmail(trimmed)) {
    return normalizeEmail(trimmed);
  }

  const inlineMatch = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (inlineMatch?.[0] && isValidEmail(inlineMatch[0])) {
    return normalizeEmail(inlineMatch[0]);
  }

  return null;
}

export function formatRecipientDisplay(fromHeader: string): string {
  const email = extractEmailAddress(fromHeader);
  if (!email) {
    return fromHeader.trim() || "—";
  }

  const name = fromHeader
    .split("<")[0]
    ?.trim()
    .replace(/^["']|["']$/g, "")
    .trim();

  if (name && normalizeEmail(name) !== email) {
    return `${name} <${email}>`;
  }

  return email;
}

export function resolveReplyRecipient(fromHeader: string): {
  display: string;
  email: string | null;
  isValid: boolean;
} {
  const email = extractEmailAddress(fromHeader);
  return {
    display: formatRecipientDisplay(fromHeader),
    email,
    isValid: Boolean(email),
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
