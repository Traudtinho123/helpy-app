import type { DetectedPlatform } from "@/features/brain/types/platform-inquiry-types";
import { PLATFORM_SOURCE_LABELS } from "@/features/brain/types/platform-inquiry-types";

const IMMOSCOUT_STRONG = [
  "immoscout24",
  "immoscout24.ch",
  "imobilienscout",
  "immobilienscout24",
];

const HOMEGATE_STRONG = ["homegate", "homegate.ch"];

const IMMOSCOUT_INQUIRY = [
  "neue anfrage",
  "kontaktanfrage",
  "objektanfrage",
  "besichtigungsanfrage",
];

const NEWHOME_STRONG = ["newhome", "newhome.ch"];
const FLATFOX_STRONG = ["flatfox", "flatfox.ch"];
const WEBSITE_STRONG = [
  "website-anfrage",
  "website anfrage",
  "kontaktformular",
  "immobilienanfrage",
];

const GENERIC_INQUIRY = ["kontaktanfrage", "anfrage", "objektanfrage"];

function normalizeText(parts: string[]): string {
  return parts.join(" ").toLowerCase();
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

/** Plattform muss im Absender/Betreff erkennbar sein — keine losen Keyword-Treffer. */
function scorePlatform(
  text: string,
  strong: string[],
  inquiry: string[]
): number {
  if (!containsAny(text, strong)) return 0;
  let score = 10;
  if (containsAny(text, inquiry)) score += 3;
  return score;
}

const HOMEGATE_INQUIRY = [
  "neue kontaktanfrage",
  "anfrage zu ihrer immobilie",
  "kontaktanfrage",
  "besichtigungsanfrage",
  ...GENERIC_INQUIRY,
];

export function detectPlatformEmail(
  from: string,
  subject: string,
  snippet: string
): DetectedPlatform | null {
  const text = normalizeText([from, subject, snippet]);

  const scores: Array<{ platform: DetectedPlatform; score: number }> = [
    { platform: "immoscout24", score: scorePlatform(text, IMMOSCOUT_STRONG, IMMOSCOUT_INQUIRY) },
    { platform: "homegate", score: scorePlatform(text, HOMEGATE_STRONG, HOMEGATE_INQUIRY) },
    { platform: "newhome", score: scorePlatform(text, NEWHOME_STRONG, GENERIC_INQUIRY) },
    { platform: "flatfox", score: scorePlatform(text, FLATFOX_STRONG, GENERIC_INQUIRY) },
    { platform: "website", score: scorePlatform(text, WEBSITE_STRONG, GENERIC_INQUIRY) },
  ];

  const best = scores
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)[0];

  return best?.platform ?? null;
}

export function getPlatformSourceLabel(platform: DetectedPlatform): string {
  return PLATFORM_SOURCE_LABELS[platform];
}

export function isPlatformRealEstateQuelle(quelle: string): boolean {
  return (
    quelle === "ImmoScout24.ch" ||
    quelle === "Homegate" ||
    quelle === "Newhome" ||
    quelle === "Flatfox" ||
    quelle === "Website Anfrage"
  );
}

export function isPlatformRealEstateVorgang(vorgang: {
  quelle?: string;
  typ?: string;
}): boolean {
  return (
    vorgang.typ === "anfrage" &&
    Boolean(vorgang.quelle && isPlatformRealEstateQuelle(vorgang.quelle))
  );
}
