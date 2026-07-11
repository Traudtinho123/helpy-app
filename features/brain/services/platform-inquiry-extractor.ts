import type {
  PlatformInquiryExtraction,
  PlatformInquiryField,
} from "@/features/brain/types/platform-inquiry-types";
import { PLATFORM_INQUIRY_MISSING } from "@/features/brain/types/platform-inquiry-types";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";

const FIELD_PATTERNS: Record<
  keyof Omit<PlatformInquiryExtraction, "nachricht">,
  RegExp[]
> = {
  interessentName: [
    /(?:name|kontakt|interessent|absender|von)[:\s]+([^\n\r|<]+)/i,
    /(?:kontaktname|contact name)[:\s]+([^\n\r|<]+)/i,
  ],
  interessentEmail: [
    /(?:e-?mail|mail)[:\s]+([^\s\n\r<>]+@[^\s\n\r<>]+)/i,
  ],
  telefon: [
    /(?:telefon|tel\.?|mobile|handy|phone)[:\s]+([+\d\s()/.\-]{8,})/i,
  ],
  objektadresse: [
    /(?:objektadresse|adresse|standort|location)[:\s]+([^\n\r]+)/i,
  ],
  objektname: [
    /(?:objekt|immobilie|inserat|titel|listing)[:\s]+([^\n\r]+)/i,
  ],
  objektLink: [
    /(https?:\/\/[^\s]*(?:immoscout24\.ch|homegate\.ch|newhome\.ch|flatfox\.ch)[^\s]*)/i,
  ],
  besichtigungstermin: [
    /(?:besichtigung|termin|wunschtermin|gewünschter termin|viewing)[:\s]+([^\n\r]+)/i,
  ],
};

function extractField(text: string, patterns: RegExp[]): PlatformInquiryField {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value && value.length > 1) {
      return value.replace(/\s{2,}/g, " ");
    }
  }

  return PLATFORM_INQUIRY_MISSING;
}

function extractNachricht(text: string, snippet: string): PlatformInquiryField {
  const patterns = [
    /(?:nachricht|mitteilung|anfrage|message)[:\s]+([\s\S]+?)(?:\n{2,}|$)/i,
    /(?:schreibt|schreiben)[:\s]+([\s\S]+?)(?:\n{2,}|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value && value.length > 10) {
      return value.slice(0, 500);
    }
  }

  const trimmedSnippet = snippet.trim();
  if (trimmedSnippet.length > 10) {
    return trimmedSnippet;
  }

  return PLATFORM_INQUIRY_MISSING;
}

function extractNameFromFromHeader(from: string): PlatformInquiryField {
  const withoutEmail = from.split("<")[0]?.trim() ?? "";
  const cleaned = withoutEmail.replace(/^["']|["']$/g, "").trim();

  if (
    cleaned &&
    !cleaned.includes("@") &&
    !/immoscout|homegate|noreply|no-reply/i.test(cleaned)
  ) {
    return cleaned;
  }

  return PLATFORM_INQUIRY_MISSING;
}

function extractInteressentEmailFromText(text: string): PlatformInquiryField {
  const matches = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) ?? [];
  for (const email of matches) {
    if (!/immoscout|homegate|noreply|no-reply|donotreply/i.test(email)) {
      return email;
    }
  }
  return PLATFORM_INQUIRY_MISSING;
}

/** Extrahiert strukturierte Felder aus Plattform-Anfrage-E-Mails. */
export function extractPlatformInquiry(
  from: string,
  subject: string,
  snippet: string
): PlatformInquiryExtraction {
  const text = `${subject}\n${snippet}\n${from}`;

  const interessentName =
    extractField(text, FIELD_PATTERNS.interessentName) === PLATFORM_INQUIRY_MISSING
      ? extractNameFromFromHeader(from)
      : extractField(text, FIELD_PATTERNS.interessentName);

  let interessentEmail = extractField(text, FIELD_PATTERNS.interessentEmail);
  if (interessentEmail === PLATFORM_INQUIRY_MISSING) {
    interessentEmail = extractInteressentEmailFromText(text);
  }
  if (interessentEmail === PLATFORM_INQUIRY_MISSING) {
    const fromEmail = extractEmailAddress(from);
    if (
      fromEmail &&
      !/immoscout|homegate|noreply|no-reply/i.test(fromEmail)
    ) {
      interessentEmail = fromEmail;
    }
  }

  return {
    interessentName,
    interessentEmail,
    telefon: extractField(text, FIELD_PATTERNS.telefon),
    objektadresse: extractField(text, FIELD_PATTERNS.objektadresse),
    objektname:
      extractField(text, FIELD_PATTERNS.objektname) === PLATFORM_INQUIRY_MISSING &&
      subject.trim()
        ? subject.trim()
        : extractField(text, FIELD_PATTERNS.objektname),
    objektLink: extractField(text, FIELD_PATTERNS.objektLink),
    besichtigungstermin: extractField(text, FIELD_PATTERNS.besichtigungstermin),
    nachricht: extractNachricht(text, snippet),
  };
}

export function buildPlatformInquiryContextLines(
  inquiry: PlatformInquiryExtraction
): string[] {
  return [
    `Interessent: ${inquiry.interessentName}`,
    `E-Mail: ${inquiry.interessentEmail}`,
    `Telefon: ${inquiry.telefon}`,
    `Objekt: ${inquiry.objektname}`,
    `Adresse: ${inquiry.objektadresse}`,
    inquiry.objektLink !== PLATFORM_INQUIRY_MISSING
      ? `Link: ${inquiry.objektLink}`
      : null,
    `Besichtigung: ${inquiry.besichtigungstermin}`,
    `Nachricht: ${inquiry.nachricht}`,
  ].filter((line): line is string => line !== null);
}

export function buildPlatformInquirySummary(
  inquiry: PlatformInquiryExtraction,
  quelle: string
): string {
  const interessent =
    inquiry.interessentName !== PLATFORM_INQUIRY_MISSING
      ? inquiry.interessentName
      : "Interessent";
  const objekt =
    inquiry.objektname !== PLATFORM_INQUIRY_MISSING
      ? inquiry.objektname
      : "Objekt";

  return `${quelle}-Anfrage von ${interessent} zu „${objekt}“.`;
}
