const EMAIL_PATTERN = /([^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)/;

export type ParsedFromHeader = {
  name: string;
  email: string;
};

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
    return { name: "System", email: "" };
  }

  const withName = raw.match(/"?([^"<]+?)"?\s*<([^>]+)>/);
  if (withName) {
    const email = normalizeEmail(withName[2]);
    const name = cleanDisplayName(withName[1]) || nameFromEmailLocalPart(email);
    if (email.includes("@")) {
      return { name, email };
    }
  }

  const angleMatch = raw.match(/<([^>]+)>/);
  if (angleMatch?.[1]) {
    const email = normalizeEmail(angleMatch[1]);
    if (email.includes("@")) {
      const prefix = cleanDisplayName(raw.split("<")[0] ?? "");
      return {
        name: prefix && !prefix.includes("@") ? prefix : nameFromEmailLocalPart(email),
        email,
      };
    }
  }

  const emailOnly = raw.match(EMAIL_PATTERN);
  if (emailOnly?.[1]) {
    const email = normalizeEmail(emailOnly[1]);
    return {
      name: nameFromEmailLocalPart(email),
      email,
    };
  }

  return { name: cleanDisplayName(raw) || "System", email: "" };
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
