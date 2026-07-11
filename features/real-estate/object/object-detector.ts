import { extractPlatformInquiry } from "@/features/brain/services/platform-inquiry-extractor";
import { PLATFORM_INQUIRY_MISSING } from "@/features/brain/types/platform-inquiry-types";
import type {
  RealEstateObjectDetectionInput,
  RealEstateObjectFieldExtraction,
  RealEstateObjectSource,
  RealEstateObjectTransaction,
} from "@/features/real-estate/object/object-types";

const PLATFORM_RULES: Array<{
  source: RealEstateObjectSource;
  strong: string[];
  inquiry?: string[];
}> = [
  {
    source: "ImmoScout24.ch",
    strong: ["immoscout24", "immoscout24.ch", "immobilienscout"],
    inquiry: ["neue anfrage", "kontaktanfrage", "objektanfrage"],
  },
  {
    source: "Homegate",
    strong: ["homegate", "homegate.ch"],
    inquiry: ["kontaktanfrage", "anfrage zu ihrer immobilie"],
  },
  {
    source: "Newhome",
    strong: ["newhome", "newhome.ch"],
    inquiry: ["kontaktanfrage", "anfrage"],
  },
  {
    source: "Flatfox",
    strong: ["flatfox", "flatfox.ch"],
    inquiry: ["anfrage", "kontaktanfrage"],
  },
  {
    source: "Website Anfrage",
    strong: [
      "website-anfrage",
      "website anfrage",
      "kontaktformular",
      "immobilienanfrage",
      "anfrage über die website",
    ],
    inquiry: ["anfrage", "kontakt"],
  },
];

function normalizeText(parts: string[]): string {
  return parts.join(" ").toLowerCase();
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function scorePlatformRule(
  text: string,
  rule: (typeof PLATFORM_RULES)[number]
): number {
  if (!containsAny(text, rule.strong)) return 0;
  let score = 10;
  if (rule.inquiry && containsAny(text, rule.inquiry)) score += 3;
  return score;
}

export function detectRealEstatePlatformSource(
  from: string,
  subject: string,
  snippet: string,
  quelle?: string
): RealEstateObjectSource | null {
  if (quelle) {
    const match = PLATFORM_RULES.find((rule) => rule.source === quelle);
    if (match) return match.source;
  }

  const text = normalizeText([from, subject, snippet]);
  let best: { source: RealEstateObjectSource; score: number } | null = null;

  for (const rule of PLATFORM_RULES) {
    const score = scorePlatformRule(text, rule);
    if (score > 0 && (!best || score > best.score)) {
      best = { source: rule.source, score };
    }
  }

  return best?.source ?? null;
}

export function isRealEstatePlatformQuelle(quelle: string): boolean {
  return PLATFORM_RULES.some((rule) => rule.source === quelle);
}

function readContextValue(
  lines: string[] | undefined,
  prefix: string
): string | null {
  if (!lines) return null;
  const line = lines.find((entry) => entry.startsWith(`${prefix}:`));
  if (!line) return null;
  const value = line.slice(prefix.length + 1).trim();
  return value && value !== PLATFORM_INQUIRY_MISSING ? value : null;
}

function parseAddressParts(adresse: string | null): {
  adresse: string | null;
  plz: string | null;
  ort: string | null;
  land: string | null;
} {
  if (!adresse) {
    return { adresse: null, plz: null, ort: null, land: null };
  }

  const swissMatch = adresse.match(
    /^(.+?),\s*(\d{4})\s+([^,]+?)(?:,\s*(Schweiz|CH))?$/i
  );
  if (swissMatch) {
    return {
      adresse: swissMatch[1].trim(),
      plz: swissMatch[2],
      ort: swissMatch[3].trim(),
      land: swissMatch[4]?.toUpperCase() === "CH" ? "Schweiz" : "Schweiz",
    };
  }

  const inlineMatch = adresse.match(/(\d{4})\s+([A-Za-zÀ-ÿ\s-]+)/);
  if (inlineMatch) {
    return {
      adresse: adresse.replace(inlineMatch[0], "").replace(/,\s*$/, "").trim(),
      plz: inlineMatch[1],
      ort: inlineMatch[2].trim(),
      land: "Schweiz",
    };
  }

  return { adresse, plz: null, ort: null, land: "Schweiz" };
}

function parseTransaction(text: string): RealEstateObjectTransaction | null {
  if (/\b(miete|mieten|vermietung|mietobjekt)\b/i.test(text)) return "Miete";
  if (/\b(kauf|verkauf|kaufobjekt|eigentumswohnung)\b/i.test(text)) return "Kauf";
  return null;
}

function parsePrice(text: string): string | null {
  const match =
    text.match(/(?:preis|miete|kaufpreis)[:\s]*([\d.'\s]+(?:chf|fr\.?)?)/i) ??
    text.match(/([\d.'\s]{4,})\s*(?:chf|fr\.?)/i);
  if (!match?.[1]) return null;
  const digits = match[1].replace(/[^\d]/g, "");
  if (!digits) return null;
  return `${Number(digits).toLocaleString("de-CH")} CHF`;
}

function parseField(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return null;
}

export function extractRealEstateObjectFields(
  input: RealEstateObjectDetectionInput
): RealEstateObjectFieldExtraction {
  const inquiry = extractPlatformInquiry(
    input.from,
    input.subject,
    input.snippet
  );
  const text = [
    input.subject,
    input.snippet,
    input.from,
    ...(input.detectedContext ?? []),
  ].join("\n");

  const rawAdresse =
    readContextValue(input.detectedContext, "Adresse") ??
    (inquiry.objektadresse !== PLATFORM_INQUIRY_MISSING
      ? inquiry.objektadresse
      : null);
  const addressParts = parseAddressParts(rawAdresse);

  const titel =
    readContextValue(input.detectedContext, "Objekt") ??
    (inquiry.objektname !== PLATFORM_INQUIRY_MISSING
      ? inquiry.objektname
      : input.subject.trim() || null);

  const objektLink =
    readContextValue(input.detectedContext, "Link") ??
    (inquiry.objektLink !== PLATFORM_INQUIRY_MISSING
      ? inquiry.objektLink
      : parseField(text, [
          /(https?:\/\/[^\s]*(?:immoscout24\.ch|homegate\.ch|newhome\.ch|flatfox\.ch)[^\s]*)/i,
        ]));

  const beschreibung =
    readContextValue(input.detectedContext, "Nachricht") ??
    (inquiry.nachricht !== PLATFORM_INQUIRY_MISSING ? inquiry.nachricht : null);

  return {
    ...addressParts,
    titel,
    beschreibung,
    transaktion: parseTransaction(text),
    preis: parsePrice(text),
    zimmer: parseField(text, [
      /(?:zimmer|z\.?\s*immer)[:\s]*([\d.½]+)/i,
      /([\d.½]+)\s*zimmer/i,
    ]),
    wohnflaeche: parseField(text, [
      /(?:wohnfläche|wohnflaeche|fläche|flaeche)[:\s]*([\d.'\s]+m²?)/i,
      /([\d.'\s]+)\s*m²/i,
    ]),
    stockwerk: parseField(text, [
      /(?:stockwerk|etage|geschoss)[:\s]*([^\n\r,]+)/i,
    ]),
    objektLink,
  };
}

export function hasRecognizedObjectData(
  fields: RealEstateObjectFieldExtraction
): boolean {
  const signals = [
    fields.titel,
    fields.adresse,
    fields.objektLink,
    fields.preis,
    fields.zimmer,
    fields.wohnflaeche,
  ].filter(Boolean);

  return signals.length >= 2 || Boolean(fields.objektLink && fields.titel);
}

export function shouldPrepareRealEstateObject(
  input: RealEstateObjectDetectionInput
): boolean {
  const quelle = detectRealEstatePlatformSource(
    input.from,
    input.subject,
    input.snippet,
    input.quelle
  );
  if (!quelle) return false;

  const fields = extractRealEstateObjectFields(input);
  return hasRecognizedObjectData(fields);
}
