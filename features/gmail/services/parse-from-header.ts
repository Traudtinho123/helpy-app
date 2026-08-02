const EMAIL_PATTERN = /([^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)/;

export const PLACEHOLDER_SENDER_LABELS = new Set([
  "system",
  "unbekannt",
  "(unbekannt)",
  "unbekannter absender",
  "unbekannter anrufer",
  "kein absender",
  "unknown",
]);

export type ParsedFromHeader = {
  name: string;
  email: string;
};

export function isPlaceholderSenderLabel(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  return PLACEHOLDER_SENDER_LABELS.has(value.trim().toLowerCase());
}

/** Anzeigename: Name wenn vorhanden, sonst E-Mail — nie System/Unbekannt. */
export function resolveSenderDisplayName(name: string, email: string): string {
  const cleanName = cleanDisplayName(name);
  if (email) {
    if (cleanName && !isPlaceholderSenderLabel(cleanName) && !cleanName.includes("@")) {
      return cleanName;
    }
    return email;
  }
  if (cleanName && !isPlaceholderSenderLabel(cleanName)) return cleanName;
  return "";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function cleanDisplayName(value: string): string {
  return value
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\\"/g, '"')
    .trim();
}

function nameFromEmailLocalPart(email: string): string {
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return local || email;
}

/**
 * Parst Gmail/Outlook From-Header robust.
 *
 * Formate:
 * A) "Thomas Müller <thomas@gmail.com>"
 * B) "DocuSign <noreply@docusign.net>"
 * C) "noreply@docusign.net"
 * D) "\"Mediamarkt\" <info@mediamarkt.ch>"
 */
export function parseFrom(fromHeader: string): ParsedFromHeader {
  return parseEmailFrom(fromHeader);
}

/** Alias — identische Implementierung wie parseFrom. */
export function parseEmailFrom(fromHeader: string): ParsedFromHeader {
  const raw = fromHeader?.trim() ?? "";
  if (!raw) {
    return { name: "", email: "" };
  }

  const withName = raw.match(/"?([^"<]+?)"?\s*<([^>]+)>/);
  if (withName) {
    const email = normalizeEmail(withName[2]);
    const parsedName = cleanDisplayName(withName[1]);
    if (email.includes("@")) {
      return {
        name: resolveSenderDisplayName(parsedName, email),
        email,
      };
    }
  }

  const angleMatch = raw.match(/<([^>]+)>/);
  if (angleMatch?.[1]) {
    const email = normalizeEmail(angleMatch[1]);
    if (email.includes("@")) {
      const prefix = cleanDisplayName(raw.split("<")[0] ?? "");
      return {
        name: resolveSenderDisplayName(prefix, email),
        email,
      };
    }
  }

  const emailOnly = raw.match(EMAIL_PATTERN);
  if (emailOnly?.[1]) {
    const email = normalizeEmail(emailOnly[1]);
    return {
      name: email,
      email,
    };
  }

  const fallbackName = cleanDisplayName(raw);
  return {
    name: isPlaceholderSenderLabel(fallbackName) ? "" : fallbackName,
    email: "",
  };
}

export function buildFromHeader(name: string, email: string): string {
  if (!email) return name.trim();
  const cleanName = cleanDisplayName(name);
  if (
    cleanName &&
    !cleanName.includes("@") &&
    cleanName.toLowerCase() !== email.toLowerCase()
  ) {
    return `${cleanName} <${email}>`;
  }
  return email;
}
