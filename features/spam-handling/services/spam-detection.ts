/** Erkennung von Nachrichten ohne relevante Dienstleistungsanfrage — v2. */

const NON_SERVICE_INTENT_LABELS = [
  "spam / newsletter",
  "werbung",
  "promotion",
  "automatische benachrichtigung",
  "community",
  "bundle",
  "sale",
  "keine dienstleistungsanfrage",
] as const;

const NON_SERVICE_INTENT_KEYS = [
  "spam",
  "newsletter",
  "werbung",
  "promotion",
  "benachrichtigung",
  "notification",
  "community",
  "bundle",
  "sale",
  "no_service",
  "spam_newsletter",
] as const;

/** Echte Kundenanfragen — Schutz vor Fehlklassifikation. */
const CUSTOMER_INQUIRY_KEYWORDS = [
  "anfrage",
  "angebot",
  "offerte",
  "besichtigung",
  "termin",
  "rückruf",
  "rueckruf",
  "projekt",
  "baustelle",
  "mandat",
  "beratung",
  "interesse",
  "bitte um rückmeldung",
  "können sie",
  "koennen sie",
  "wir benötigen",
  "wir benoetigen",
  "wir interessieren uns",
  "kostenvoranschlag",
  "offertanfrage",
  "angebotsanfrage",
] as const;

const TRAVEL_OFFER_KEYWORDS = [
  "holiday",
  "holidays",
  "vacation",
  "travel",
  "booking",
  "check24",
  "ab-in-den-urlaub",
  "urlaub",
  "reisen",
  "hotel",
  "flug",
  "deal",
  "gutschein",
] as const;

const NEWSLETTER_NEWS_KEYWORDS = [
  "newsletter",
  "news",
  "daily update",
  "digest",
  "neuigkeiten",
  "presse",
  "magazin",
  "blog",
  "update",
  "abonnieren",
  "unsubscribe",
  "abmelden",
  "abbestellen",
] as const;

const SOCIAL_NETWORK_KEYWORDS = [
  "xing",
  "linkedin",
  "facebook",
  "instagram",
  "social",
  "community",
  "kontaktvorschlag",
  "neue nachricht auf",
  "dein netzwerk",
] as const;

const SHOPPING_KEYWORDS = [
  "sale",
  "rabatt",
  "angebot nur heute",
  "black friday",
  "cyber monday",
  "shop",
  "warenkorb",
  "bestellung",
  "versand",
  "lieferung",
  "petfriends",
  "zooplus",
  "amazon",
  "zalando",
  "temu",
  "aliexpress",
] as const;

const AUTO_NOTIFICATION_KEYWORDS = [
  "no-reply",
  "noreply",
  "notification",
  "benachrichtigung",
  "sicherheitswarnung",
  "login",
  "passwort",
  "konto",
  "bestätigungscode",
  "bestaetigungscode",
  "code",
  "systemmeldung",
  "mailer-daemon",
  "do not reply",
  "nicht antworten",
  "automated message",
  "automatische benachrichtigung",
] as const;

const MARKETING_KEYWORDS = [
  "exklusiv",
  "nur heute",
  "spare",
  "sparen",
  "gewinnen",
  "kostenlos",
  "gratis",
  "aktion",
  "limited",
  "deal",
  "promotion",
  "turbo sales bundle",
  "werbung",
  "promo",
  "marketing",
  "bundle",
] as const;

const CLEAR_NON_SERVICE_SENDER_HINTS = [
  "noreply",
  "no-reply",
  "no_reply",
  "donotreply",
  "newsletter",
  "news@",
  "marketing@",
  "promo@",
  "notification",
  "notifications@",
  "mailer-daemon",
  "bounce@",
  "amazon",
  "zalando",
  "check24",
  "linkedin",
  "xing",
  "facebook",
  "instagram",
  "petfriends",
  "zooplus",
  "temu",
  "aliexpress",
  "booking.com",
  "ab-in-den-urlaub",
  "urlaub.de",
  "rewe.",
  "lidl.",
  "otto.de",
  "ebay.",
] as const;

const SPAM_KEYWORD_GROUPS = [
  TRAVEL_OFFER_KEYWORDS,
  NEWSLETTER_NEWS_KEYWORDS,
  SOCIAL_NETWORK_KEYWORDS,
  SHOPPING_KEYWORDS,
  AUTO_NOTIFICATION_KEYWORDS,
  MARKETING_KEYWORDS,
] as const;

export type NonServiceInquirySource = {
  intent?: string;
  intentLabel?: string;
  titel?: string;
  snippet?: string;
  summary?: string;
  from?: string;
  brainIntent?: string;
};

export type NonServiceDetectionResult = {
  isNonService: boolean;
  signalCount: number;
  matchedCategories: number;
  clearNonServiceSender: boolean;
  customerInquirySafeguard: boolean;
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsKeyword(text: string, keyword: string): boolean {
  const normalized = normalizeText(text);
  const needle = keyword.toLowerCase();

  if (needle.includes(" ")) {
    return normalized.includes(needle);
  }

  if (/^[a-z0-9@.-]+$/i.test(needle)) {
    const pattern = new RegExp(
      `(^|[\\s"'([<{])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[\\s"'\\])>,.;:!?])`,
      "i"
    );
    return pattern.test(normalized) || normalized.includes(needle);
  }

  return normalized.includes(needle);
}

function countKeywordMatches(text: string, keywords: readonly string[]): number {
  return keywords.reduce(
    (count, keyword) => (containsKeyword(text, keyword) ? count + 1 : count),
    0
  );
}

function countMatchedCategories(text: string): number {
  return SPAM_KEYWORD_GROUPS.reduce(
    (count, group) => (countKeywordMatches(text, group) > 0 ? count + 1 : count),
    0
  );
}

function countAllSpamSignals(text: string): number {
  return SPAM_KEYWORD_GROUPS.reduce(
    (total, group) => total + countKeywordMatches(text, group),
    0
  );
}

function matchesIntentLabel(value?: string): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return NON_SERVICE_INTENT_LABELS.some(
    (label) => normalized === label || normalized.includes(label)
  );
}

function matchesIntentKey(value?: string): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().replace(/[\s-/]+/g, "_");
  return NON_SERVICE_INTENT_KEYS.some(
    (key) => normalized === key || normalized.includes(key)
  );
}

function buildCombinedText(source: NonServiceInquirySource): string {
  return [
    source.intentLabel,
    source.intent,
    source.brainIntent,
    source.titel,
    source.snippet,
    source.summary,
    source.from,
  ]
    .filter(Boolean)
    .join(" ");
}

export function hasCustomerInquirySignals(text: string): boolean {
  return CUSTOMER_INQUIRY_KEYWORDS.some((keyword) =>
    containsKeyword(text, keyword)
  );
}

export function isClearlyNonServiceSender(from?: string): boolean {
  if (!from?.trim()) return false;
  const normalized = normalizeText(from);
  return CLEAR_NON_SERVICE_SENDER_HINTS.some((hint) =>
    normalized.includes(hint)
  );
}

export function analyzeNonServiceInquiry(
  source: NonServiceInquirySource
): NonServiceDetectionResult {
  if (
    matchesIntentLabel(source.intentLabel) ||
    matchesIntentLabel(source.brainIntent) ||
    matchesIntentKey(source.intent)
  ) {
    return {
      isNonService: true,
      signalCount: 1,
      matchedCategories: 1,
      clearNonServiceSender: isClearlyNonServiceSender(source.from),
      customerInquirySafeguard: false,
    };
  }

  const combined = buildCombinedText(source);
  const clearNonServiceSender = isClearlyNonServiceSender(source.from);
  const customerInquirySafeguard =
    hasCustomerInquirySignals(combined) && !clearNonServiceSender;

  if (customerInquirySafeguard) {
    return {
      isNonService: false,
      signalCount: countAllSpamSignals(combined),
      matchedCategories: countMatchedCategories(combined),
      clearNonServiceSender,
      customerInquirySafeguard: true,
    };
  }

  const signalCount = countAllSpamSignals(combined);
  const matchedCategories = countMatchedCategories(combined);

  const isNonService =
    clearNonServiceSender || matchedCategories >= 2 || signalCount >= 2;

  return {
    isNonService,
    signalCount,
    matchedCategories,
    clearNonServiceSender,
    customerInquirySafeguard: false,
  };
}

/** Prüft, ob eine Gmail-Nachricht keine relevante Dienstleistungsanfrage ist. */
export function isNonServiceInquiry(source: NonServiceInquirySource): boolean {
  return analyzeNonServiceInquiry(source).isNonService;
}

export function isNonServiceBrainIntent(intent?: string): boolean {
  return matchesIntentLabel(intent);
}

/** Alle Spam-Schlüsselwörter für Intent-Vorprüfung. */
export function getSpamKeywordHints(): readonly string[] {
  return SPAM_KEYWORD_GROUPS.flat();
}

export {
  CUSTOMER_INQUIRY_KEYWORDS,
  CLEAR_NON_SERVICE_SENDER_HINTS,
};
