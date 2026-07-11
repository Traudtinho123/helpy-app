import type { BrainV3Intent } from "@/features/brain/types/brain-v3-types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type IntentRule = {
  intent: BrainV3Intent;
  keywords: readonly string[];
};

/** Klare Besichtigungs-Signale (RE). */
export const VIEWING_INTENT_KEYWORDS = [
  "besichtigung",
  "besichtigen",
  "besichtigungstermin",
  "besichtigungswunsch",
  "objekt besichtigen",
  "wohnung besichtigen",
  "haus besichtigen",
  "immobilie besichtigen",
  "wohnung anschauen",
  "wohnung ansehen",
  "haus anschauen",
  "objekt anschauen",
  "termin zur besichtigung",
  "termin für die besichtigung",
  "termin fuer die besichtigung",
] as const;

export const BUSINESS_INQUIRY_KEYWORDS = [
  "handwerker",
  "dienstleister",
  "kooperation",
  "zusammenarbeit",
  "partnerangebot",
  "partnerschaft",
  "lieferant",
  "subunternehmer",
  "wartung",
  "facility",
  "reinigungsservice",
  "versicherungsangebot",
  "werbung schalten",
  "inserat schalten",
  "b2b",
  "geschäftsanfrage",
] as const;

/** Shared / soft Bestandskunden-Signale (alle Skills). */
export const EXISTING_CUSTOMER_SHARED_KEYWORDS = [
  "bestandskunde",
  "wie besprochen",
  "wie vereinbart",
  "folgende nachricht zu unserem",
] as const;

/** RE: Miet-/Objekt-Korrespondenz. */
export const EXISTING_CUSTOMER_RE_KEYWORDS = [
  ...EXISTING_CUSTOMER_SHARED_KEYWORDS,
  "unser mietvertrag",
  "mietvertrag",
  "nachmieter",
  "kündigung",
  "kaution",
  "nebenkostenabrechnung",
  "hausverwaltung",
  "schaden am objekt",
  "reparatur",
  "mängelrüge",
  "mietrückstand",
  "mieterhöhung",
  "verlängerung des vertrags",
] as const;

/** Construction: laufende Aufträge / Baustellen. */
export const EXISTING_CUSTOMER_CONSTRUCTION_KEYWORDS = [
  ...EXISTING_CUSTOMER_SHARED_KEYWORDS,
  "laufender auftrag",
  "bestehender auftrag",
  "nachtrag",
  "baustellenupdate",
  "baustellen-update",
  "mängelbeseitigung",
  "gewährleistung",
] as const;

/** Consulting: Mandanten-Korrespondenz. */
export const EXISTING_CUSTOMER_CONSULTING_KEYWORDS = [
  ...EXISTING_CUSTOMER_SHARED_KEYWORDS,
  "unser mandat",
  "laufendes mandat",
  "aktenzeichen",
  "schriftsatz",
  "mandantenakte",
] as const;

/** @deprecated Prefer skill-specific sets; kept for spam/compat imports. */
export const EXISTING_CUSTOMER_KEYWORDS = EXISTING_CUSTOMER_RE_KEYWORDS;

export const INTEREST_INQUIRY_KEYWORDS = [
  "interessiert",
  "interesse an",
  "anfrage zu",
  "anfrage bezüglich",
  "exposé",
  "expose",
  "objektinformationen",
  "mehr informationen zum objekt",
  "wohnungsanfrage",
  "immobilienanfrage",
  "kaufinteresse",
  "mietinteresse",
  "wir interessieren uns",
  "ich interessiere mich",
  "bitte um rückmeldung",
  "kontaktaufnahme",
] as const;

export const CONSTRUCTION_SITE_VISIT_KEYWORDS = [
  "vor-ort-termin",
  "vor ort termin",
  "termin vor ort",
  "baustellenbesichtigung",
  "aufmass",
  "aufmaß",
  "ortstermin",
] as const;

export const CONSTRUCTION_MATERIAL_KEYWORDS = [
  "material",
  "materialliste",
  "lieferung",
  "bestellung material",
  "ersatzteil",
] as const;

export const CONSTRUCTION_ORDER_KEYWORDS = [
  "auftrag",
  "auftragsbestätigung",
  "auftragsbestaetigung",
  "bauprojekt",
  "baustelle",
  "montage",
  "renovierung",
  "umbau",
  "sanierung",
] as const;

export const CONSULTING_MANDATE_KEYWORDS = [
  "mandat",
  "mandatsanfrage",
  "rechtsberatung",
  "beratung anfragen",
  "kanzlei",
  "vollmacht",
] as const;

export const CONSULTING_INTRO_KEYWORDS = [
  "erstgespräch",
  "erstgespraech",
  "kennengelernt",
  "vorstellungstermin",
  "beratungsgespräch",
  "beratungsgespraech",
] as const;

/**
 * Intent-Regeln pro Skill (Reihenfolge = Priorität).
 * Shared Intents (Spam, Rechnung, …) werden im Detector separat geprüft.
 */
export const SKILL_INTENT_RULES: Record<HelpySkill, IntentRule[]> = {
  "real-estate": [
    { intent: "Besichtigung", keywords: VIEWING_INTENT_KEYWORDS },
    {
      intent: "Bestandskunden-Kommunikation",
      keywords: EXISTING_CUSTOMER_RE_KEYWORDS,
    },
    { intent: "Geschäftsanfrage", keywords: BUSINESS_INQUIRY_KEYWORDS },
    { intent: "Interessentenanfrage", keywords: INTEREST_INQUIRY_KEYWORDS },
    {
      intent: "Neue Anfrage",
      keywords: ["anfrage", "information", "wir benötigen", "projekt"],
    },
  ],
  construction: [
    {
      intent: "Angebotsanfrage",
      keywords: [
        "offerte",
        "offertanfrage",
        "kostenvoranschlag",
        "angebot anfordern",
        "angebotsanfrage",
      ],
    },
    { intent: "Vor-Ort-Termin", keywords: CONSTRUCTION_SITE_VISIT_KEYWORDS },
    { intent: "Materialanfrage", keywords: CONSTRUCTION_MATERIAL_KEYWORDS },
    { intent: "Auftragsanfrage", keywords: CONSTRUCTION_ORDER_KEYWORDS },
    {
      intent: "Bestandskunden-Kommunikation",
      keywords: EXISTING_CUSTOMER_CONSTRUCTION_KEYWORDS,
    },
    { intent: "Geschäftsanfrage", keywords: BUSINESS_INQUIRY_KEYWORDS },
    {
      intent: "Neue Anfrage",
      keywords: ["anfrage", "baustelle", "projekt", "wir benötigen"],
    },
  ],
  "consulting-legal": [
    {
      intent: "Frist",
      keywords: ["frist", "einspruch", "stellungnahme", "deadline"],
    },
    { intent: "Erstgespräch", keywords: CONSULTING_INTRO_KEYWORDS },
    { intent: "Mandatsanfrage", keywords: CONSULTING_MANDATE_KEYWORDS },
    {
      intent: "Bestandskunden-Kommunikation",
      keywords: EXISTING_CUSTOMER_CONSULTING_KEYWORDS,
    },
    {
      intent: "Dokument",
      keywords: ["dokument", "anhang", "pdf", "unterlagen", "vertrag"],
    },
    {
      intent: "Neue Anfrage",
      keywords: ["anfrage", "beratung", "mandat", "projekt", "wir benötigen"],
    },
  ],
};

export function helpySkillToBrainSkill(
  skill: HelpySkill
): "HELPY Real Estate" | "HELPY Construction" | "HELPY Consulting & Legal" {
  switch (skill) {
    case "construction":
      return "HELPY Construction";
    case "consulting-legal":
      return "HELPY Consulting & Legal";
    case "real-estate":
    default:
      return "HELPY Real Estate";
  }
}
