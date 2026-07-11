import {
  formatGermanDateLabel,
  parseViewingTargetDate,
} from "@/features/appointment-suggestions/services/viewing-date-parser";
import {
  formatParsedTime,
  parseGermanTime,
} from "@/features/appointment-suggestions/services/viewing-time-parser";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import type { PlatformInquiryExtraction } from "@/features/brain/types/platform-inquiry-types";
import { PLATFORM_INQUIRY_MISSING } from "@/features/brain/types/platform-inquiry-types";

export type ViewingExtraction = {
  preferredDate: string | null;
  preferredDateLabel: string | null;
  preferredTimeWindow: string | null;
  objectHint: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  urgency: "hoch" | "mittel" | "niedrig" | null;
  rawSignals: string[];
};

export type ViewingExtractionInput = {
  from: string;
  subject: string;
  snippet: string;
  platformInquiry?: PlatformInquiryExtraction;
};

function extractPhone(text: string): string | null {
  const match = text.match(/(?:\+|00)?\d[\d\s/().-]{7,}\d/);
  return match ? match[0].replace(/\s+/g, " ").trim() : null;
}

function extractObjectHint(
  subject: string,
  snippet: string,
  platformInquiry?: PlatformInquiryExtraction
): string | null {
  if (
    platformInquiry?.objektname &&
    platformInquiry.objektname !== PLATFORM_INQUIRY_MISSING
  ) {
    return platformInquiry.objektname;
  }
  if (
    platformInquiry?.objektadresse &&
    platformInquiry.objektadresse !== PLATFORM_INQUIRY_MISSING
  ) {
    return platformInquiry.objektadresse;
  }

  const haystack = `${subject} ${snippet}`;
  const quoted = haystack.match(/[„"]([^„"]{4,80})[“"]/);
  if (quoted?.[1]) return quoted[1].trim();

  // Straße zuerst — präziser als Freitext nach „Wohnung …“
  const streetMatch = haystack.match(
    /\b([A-ZÄÖÜ][a-zäöüß]+(?:straße|strasse|weg|gasse|platz)\s+\d+[a-zA-Z]?)\b/
  );
  if (streetMatch?.[1]) return streetMatch[1];

  const objectMatch = haystack.match(
    /(?:objekt|wohnung|haus|immobilie|exposé|expose)[:\s]+([^\n.,!?]{4,60}?)(?=\s+(?:ich|wir|gerne|möchte|moechte|bitte|am|um|tel|telefon)|[.!?]|$)/i
  );
  if (objectMatch?.[1]) return objectMatch[1].trim();

  return null;
}

function extractUrgency(text: string): ViewingExtraction["urgency"] {
  const normalized = text.toLowerCase();
  if (
    /dringend|sofort|asap|heute noch|möglichst bald|eilig/.test(normalized)
  ) {
    return "hoch";
  }
  if (/diese woche|nächste woche|naechste woche|morgen/.test(normalized)) {
    return "mittel";
  }
  return null;
}

function extractSenderName(from: string): string {
  const withoutEmail = from.split("<")[0]?.trim() ?? from;
  return withoutEmail.replace(/^["']|["']$/g, "").trim() || from;
}

function buildTimeWindowLabel(text: string): string | null {
  const parsed = parseGermanTime(text);
  if (parsed) {
    return `${formatParsedTime(parsed)} Uhr`;
  }

  const lower = text.toLowerCase();
  if (/vormittag|morgens|früh|frueh/.test(lower)) return "Vormittag";
  if (/nachmittag/.test(lower)) return "Nachmittag";
  if (/abend|abends/.test(lower)) return "Abend";
  return null;
}

/**
 * Strukturierte Extraktion für Besichtigungstermine.
 * Nutzt bestehende Datums-/Zeit-Parser und optionale Plattform-Felder.
 */
export function extractViewingDetails(
  input: ViewingExtractionInput
): ViewingExtraction {
  const haystack = `${input.subject}\n${input.snippet}`;
  const preferredDate = parseViewingTargetDate(haystack);
  const preferredTimeWindow = buildTimeWindowLabel(haystack);
  const objectHint = extractObjectHint(
    input.subject,
    input.snippet,
    input.platformInquiry
  );

  const contactEmail =
    (input.platformInquiry?.interessentEmail &&
    input.platformInquiry.interessentEmail !== PLATFORM_INQUIRY_MISSING
      ? input.platformInquiry.interessentEmail
      : null) ??
    extractEmailAddress(input.from) ??
    extractEmailAddress(haystack);

  const contactPhone =
    (input.platformInquiry?.telefon &&
    input.platformInquiry.telefon !== PLATFORM_INQUIRY_MISSING
      ? input.platformInquiry.telefon
      : null) ?? extractPhone(haystack);

  const contactName =
    (input.platformInquiry?.interessentName &&
    input.platformInquiry.interessentName !== PLATFORM_INQUIRY_MISSING
      ? input.platformInquiry.interessentName
      : null) ?? extractSenderName(input.from);

  const rawSignals: string[] = [];
  if (preferredDate) rawSignals.push(`Datum:${preferredDate}`);
  if (preferredTimeWindow) rawSignals.push(`Zeit:${preferredTimeWindow}`);
  if (objectHint) rawSignals.push(`Objekt:${objectHint}`);

  return {
    preferredDate,
    preferredDateLabel: preferredDate
      ? formatGermanDateLabel(preferredDate)
      : null,
    preferredTimeWindow,
    objectHint,
    contactName,
    contactEmail,
    contactPhone,
    urgency: extractUrgency(haystack),
    rawSignals,
  };
}

export function buildViewingContextLines(
  extraction: ViewingExtraction
): string[] {
  const lines: string[] = [];
  if (extraction.objectHint) {
    lines.push(`Objekt: ${extraction.objectHint}`);
  }
  if (extraction.preferredDateLabel) {
    lines.push(`Wunschtermin: ${extraction.preferredDateLabel}`);
  }
  if (extraction.preferredTimeWindow) {
    lines.push(`Zeitfenster: ${extraction.preferredTimeWindow}`);
  }
  if (extraction.contactName) {
    lines.push(`Interessent: ${extraction.contactName}`);
  }
  if (extraction.contactEmail) {
    lines.push(`E-Mail: ${extraction.contactEmail}`);
  }
  if (extraction.contactPhone) {
    lines.push(`Telefon: ${extraction.contactPhone}`);
  }
  if (extraction.urgency) {
    lines.push(`Dringlichkeit: ${extraction.urgency}`);
  }
  return lines;
}
