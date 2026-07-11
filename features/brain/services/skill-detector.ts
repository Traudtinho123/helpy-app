import type { BrainV3Skill } from "@/features/brain/types/brain-v3-types";

const REAL_ESTATE_KEYWORDS = [
  "immobilie",
  "wohnung",
  "haus",
  "miete",
  "kauf",
  "besichtigung",
  "objekt",
  "exposé",
  "expose",
  "makler",
  "adresse",
  "zimmer",
];

const CONSTRUCTION_KEYWORDS = [
  "bauprojekt",
  "baustelle",
  "renovierung",
  "umbau",
  "sanierung",
  "offerte",
  "angebot",
  "material",
  "termin vor ort",
  "handwerker",
  "montage",
];

const CONSULTING_LEGAL_KEYWORDS = [
  "mandat",
  "vertrag",
  "beratung",
  "frist",
  "kanzlei",
  "dokument",
  "vollmacht",
  "projekt",
  "workshop",
  "erstgespräch",
  "erstgespraech",
];

function countMatches(text: string, keywords: string[]): number {
  return keywords.reduce(
    (count, keyword) => (text.includes(keyword) ? count + 1 : count),
    0
  );
}

/** Regelbasierte Skill-Erkennung — später durch KI ersetzbar. */
export function detectSkill(text: string): BrainV3Skill {
  const normalized = text.toLowerCase();

  const scores: Array<{ skill: BrainV3Skill; score: number }> = [
    {
      skill: "HELPY Real Estate",
      score: countMatches(normalized, REAL_ESTATE_KEYWORDS),
    },
    {
      skill: "HELPY Construction",
      score: countMatches(normalized, CONSTRUCTION_KEYWORDS),
    },
    {
      skill: "HELPY Consulting & Legal",
      score: countMatches(normalized, CONSULTING_LEGAL_KEYWORDS),
    },
  ];

  const best = scores.reduce((top, current) =>
    current.score > top.score ? current : top
  );

  return best.score > 0 ? best.skill : "Allgemein";
}
