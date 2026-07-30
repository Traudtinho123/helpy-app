import type { ExtractedSuchprofil, SuchprofilArt } from "@/features/matching/types/matching-types";

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function parseSwissNumber(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) ? value : null;
}

const SWISS_CITIES = [
  "zürich",
  "zurich",
  "winterthur",
  "bern",
  "basel",
  "luzern",
  "st. gallen",
  "st gallen",
  "genf",
  "geneve",
  "genève",
  "lausanne",
  "baden",
  "aargau",
  "zug",
  "schaffhausen",
  "thun",
  "biel",
];

const OBJEKTTYP_KEYWORDS: Record<string, string> = {
  wohnung: "Wohnung",
  haus: "Haus",
  attika: "Attikawohnung",
  attic: "Attikawohnung",
  maisonette: "Maisonette",
  studio: "Studio",
  loft: "Wohnung",
  einfamilienhaus: "Haus",
  efh: "Haus",
  mfh: "Haus",
  gewerbe: "Gewerbe",
  büro: "Gewerbe",
  grundstück: "Grundstück",
  parzelle: "Grundstück",
};

/** Regelbasierte Extraktion aus E-Mail- oder Vorgangstext. */
export function extractSuchprofilFromText(text: string): ExtractedSuchprofil {
  const normalized = normalizeText(text);
  const lower = normalized.toLowerCase();
  const objekttyp: string[] = [];
  const lagen: string[] = [];
  const muss_kriterien: string[] = [];
  let art: SuchprofilArt | null = null;
  let zimmer_min: number | null = null;
  let zimmer_max: number | null = null;
  let flaeche_min: number | null = null;
  let flaeche_max: number | null = null;
  let preis_max: number | null = null;
  let confidence = 0;

  if (/\b(kaufen|kauf|eigentum|eigenheim)\b/.test(lower)) {
    art = "kaufen";
    confidence += 15;
  } else if (/\b(mieten|miete|mietwohnung|mietobjekt)\b/.test(lower)) {
    art = "mieten";
    confidence += 15;
  }

  const zimmerRangeMatch = lower.match(
    /(\d(?:[.,]\d)?)\s*[-–bis]+\s*(\d(?:[.,]\d)?)\s*zimmer/
  );
  const zimmerSingleMatch = lower.match(/(\d(?:[.,]\d)?)\s*zimmer/);

  if (zimmerRangeMatch) {
    zimmer_min = Number(zimmerRangeMatch[1].replace(",", "."));
    zimmer_max = Number(zimmerRangeMatch[2].replace(",", "."));
    confidence += 25;
  } else if (zimmerSingleMatch) {
    const value = Number(zimmerSingleMatch[1].replace(",", "."));
    zimmer_min = value;
    zimmer_max = value;
    confidence += 20;
  }

  const flaecheMatch = lower.match(
    /(\d+)\s*[-–bis]+\s*(\d+)\s*m[²2]/
  );
  if (flaecheMatch) {
    flaeche_min = Number(flaecheMatch[1]);
    flaeche_max = Number(flaecheMatch[2]);
    confidence += 10;
  } else {
    const flaecheSingle = lower.match(/(?:min\.?\s*)?(\d+)\s*m[²2]/);
    if (flaecheSingle) {
      flaeche_min = Number(flaecheSingle[1]);
      confidence += 8;
    }
  }

  const budgetMatch =
    normalized.match(
      /budget\s*(?:bis|max\.?|ca\.?)?\s*(?:chf|fr\.?)?\s*([\d.'\s]+)/i
    ) ??
    normalized.match(/(?:bis|max\.?|ca\.?)\s*(?:chf|fr\.?)\s*([\d.'\s]+)/i) ??
    normalized.match(/(?:chf|fr\.?)\s*([\d.'\s]{3,})/i) ??
    normalized.match(/([\d.'\s]{4,})\s*(?:chf|fr\.?)/i);

  if (budgetMatch?.[1]) {
    preis_max = parseSwissNumber(budgetMatch[1]);
    if (preis_max) confidence += 25;
  }

  for (const [keyword, label] of Object.entries(OBJEKTTYP_KEYWORDS)) {
    if (lower.includes(keyword) && !objekttyp.includes(label)) {
      objekttyp.push(label);
      confidence += 8;
    }
  }

  const locationOrMatch = lower.match(
    /(?:in|region|umgebung|kanton)\s+([a-zäöüéèêà. '\-]+?)(?:\s+oder\s+([a-zäöüéèêà. '\-]+?))?(?:\s|,|\.|$)/i
  );
  if (locationOrMatch) {
    const candidates = [locationOrMatch[1], locationOrMatch[2]].filter(Boolean);
    for (const candidate of candidates) {
      const trimmed = candidate!.trim();
      if (trimmed.length >= 3) {
        lagen.push(trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
      }
    }
    if (lagen.length) confidence += 20;
  }

  for (const city of SWISS_CITIES) {
    if (lower.includes(city)) {
      const label = city.charAt(0).toUpperCase() + city.slice(1);
      if (!lagen.some((l) => l.toLowerCase() === city)) {
        lagen.push(label === "Zurich" ? "Zürich" : label);
        confidence += 10;
      }
    }
  }

  if (/\b(balkon|terrasse)\b/.test(lower)) muss_kriterien.push("Balkon/Terrasse");
  if (/\b(garage|parkplatz|stellplatz)\b/.test(lower)) muss_kriterien.push("Garage/Parkplatz");
  if (/\b(aufzug|lift)\b/.test(lower)) muss_kriterien.push("Lift");
  if (/\b(haustier|hund|katze)\b/.test(lower)) muss_kriterien.push("Haustier erlaubt");
  if (/\b(neubau|neu\s+bauen)\b/.test(lower)) muss_kriterien.push("Neubau");
  if (muss_kriterien.length) confidence += muss_kriterien.length * 5;

  return {
    art,
    objekttyp,
    zimmer_min,
    zimmer_max,
    flaeche_min,
    flaeche_max,
    preis_max,
    lagen: [...new Set(lagen)],
    muss_kriterien: [...new Set(muss_kriterien)],
    confidence: Math.min(confidence, 100),
    sourceText: normalized.slice(0, 500),
  };
}

export function isSuchprofilExtractionConfident(
  extracted: ExtractedSuchprofil
): boolean {
  return extracted.confidence >= 40;
}
