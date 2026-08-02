const EMAIL_PATTERN = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

export type ParsedFromHeader = {
  name: string;
  email: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim());
}

function nameFromEmailLocalPart(email: string): string {
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return local || email;
}

/**
 * Parst Gmail/Outlook From-Header robust.
 *
 * Beispiele:
 * - "DocuSign <noreply@docusign.com>" → { name: "DocuSign", email: "noreply@docusign.com" }
 * - "Thomas Müller <thomas@gmail.com>" → { name: "Thomas Müller", email: "thomas@gmail.com" }
 * - "thomas@gmail.com" → { name: "thomas", email: "thomas@gmail.com" }
 */
export function parseFrom(fromHeader: string): ParsedFromHeader {
  const raw = fromHeader?.trim() ?? "";
  if (!raw) {
    return { name: "Unbekannt", email: "" };
  }

  const namedMatch = raw.match(/^"?([^"<]+)"?\s*<([^>]+)>$/);
  if (namedMatch) {
    const email = namedMatch[2].trim();
    const name = namedMatch[1].trim().replace(/^["']|["']$/g, "").trim();
    if (isValidEmail(email)) {
      return {
        name: name || nameFromEmailLocalPart(normalizeEmail(email)),
        email: normalizeEmail(email),
      };
    }
  }

  const angleMatch = raw.match(/<([^>]+)>/);
  if (angleMatch?.[1]) {
    const email = angleMatch[1].trim();
    if (isValidEmail(email)) {
      const normalized = normalizeEmail(email);
      const prefixName = raw.split("<")[0]?.trim().replace(/^["']|["']$/g, "").trim();
      return {
        name: prefixName && !prefixName.includes("@") ? prefixName : nameFromEmailLocalPart(normalized),
        email: normalized,
      };
    }
  }

  if (isValidEmail(raw)) {
    const normalized = normalizeEmail(raw);
    return {
      name: nameFromEmailLocalPart(normalized),
      email: normalized,
    };
  }

  const emailOnly = raw.match(EMAIL_PATTERN);
  if (emailOnly?.[1] && isValidEmail(emailOnly[1])) {
    const normalized = normalizeEmail(emailOnly[1]);
    return {
      name: nameFromEmailLocalPart(normalized),
      email: normalized,
    };
  }

  return { name: raw, email: "" };
}

export function buildFromHeader(name: string, email: string): string {
  if (!email) return name.trim();
  const cleanName = name.trim();
  if (cleanName && !cleanName.includes("@") && cleanName.toLowerCase() !== email.toLowerCase()) {
    return `${cleanName} <${email}>`;
  }
  return email;
}
