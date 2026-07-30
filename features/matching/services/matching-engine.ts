import type {
  MatchScoreBreakdown,
  SuchprofilRecord,
} from "@/features/matching/types/matching-types";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";

const OBJEKTTYP_KEYWORDS: Record<string, string[]> = {
  Wohnung: ["wohnung", "apartment", "flat"],
  Haus: ["haus", "einfamilien", "efh", "mfh", "chalet", "villa"],
  Attikawohnung: ["attika", "attic", "dachgeschoss"],
  Maisonette: ["maisonette"],
  Studio: ["studio"],
  Gewerbe: ["gewerbe", "büro", "office", "laden", "geschäft"],
  Grundstück: ["grundstück", "parzelle", "bauland"],
};

export function parsePriceChf(value: string | null | undefined): number | null {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseZimmer(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(\d+(?:[.,]\d)?)/);
  if (!match) return null;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseFlaeche(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferObjekttyp(object: RealEstateObject): string | null {
  const haystack = `${object.titel} ${object.beschreibung}`.toLowerCase();
  for (const [typ, keywords] of Object.entries(OBJEKTTYP_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return typ;
    }
  }
  return null;
}

function locationMatches(lagen: string[], object: RealEstateObject): boolean {
  if (!lagen.length) return true;
  const haystack = `${object.ort} ${object.plz} ${object.adresse}`.toLowerCase();
  return lagen.some((lage) => haystack.includes(lage.toLowerCase()));
}

function mustCriterionMatches(
  criterion: string,
  object: RealEstateObject
): boolean {
  const haystack = `${object.titel} ${object.beschreibung}`.toLowerCase();
  const normalized = criterion.toLowerCase();

  if (normalized.includes("balkon") || normalized.includes("terrasse")) {
    return /\b(balkon|terrasse|loggia)\b/.test(haystack);
  }
  if (normalized.includes("garage") || normalized.includes("parkplatz")) {
    return /\b(garage|parkplatz|stellplatz|einstellplatz)\b/.test(haystack);
  }
  if (normalized.includes("lift")) {
    return /\b(lift|aufzug)\b/.test(haystack);
  }
  if (normalized.includes("haustier")) {
    return /\b(haustier|hund|katze|tier)\b/.test(haystack);
  }
  if (normalized.includes("neubau")) {
    return /\b(neubau|neu\s+bauen|erstbezug)\b/.test(haystack);
  }

  return haystack.includes(normalized);
}

function artMatches(
  art: SuchprofilRecord["art"],
  object: RealEstateObject
): boolean {
  if (!object.transaktion) return true;
  if (art === "kaufen") return object.transaktion === "Kauf";
  return object.transaktion === "Miete";
}

export function computeMatchScore(
  profil: SuchprofilRecord,
  object: RealEstateObject
): { score: number; breakdown: MatchScoreBreakdown } {
  if (!profil.aktiv) {
    return {
      score: 0,
      breakdown: { preis: 0, zimmer: 0, lage: 0, objekttyp: 0, muss_kriterien: 0 },
    };
  }

  if (!artMatches(profil.art, object)) {
    return {
      score: 0,
      breakdown: { preis: 0, zimmer: 0, lage: 0, objekttyp: 0, muss_kriterien: 0 },
    };
  }

  const breakdown: MatchScoreBreakdown = {
    preis: 0,
    zimmer: 0,
    lage: 0,
    objekttyp: 0,
    muss_kriterien: 0,
  };

  const objectPrice = parsePriceChf(object.preis);
  if (profil.preis_max != null && objectPrice != null) {
    breakdown.preis = objectPrice <= profil.preis_max ? 30 : 0;
  } else if (profil.preis_max == null) {
    breakdown.preis = 15;
  }

  const objectZimmer = parseZimmer(object.zimmer);
  if (objectZimmer != null && (profil.zimmer_min != null || profil.zimmer_max != null)) {
    const min = profil.zimmer_min ?? 0;
    const max = profil.zimmer_max ?? 99;
    breakdown.zimmer = objectZimmer >= min && objectZimmer <= max ? 20 : 0;
  } else if (profil.zimmer_min == null && profil.zimmer_max == null) {
    breakdown.zimmer = 10;
  }

  if (profil.lagen.length) {
    breakdown.lage = locationMatches(profil.lagen, object) ? 20 : 0;
  } else {
    breakdown.lage = 10;
  }

  const inferredTyp = inferObjekttyp(object);
  if (profil.objekttyp.length && inferredTyp) {
    breakdown.objekttyp = profil.objekttyp.includes(inferredTyp) ? 10 : 0;
  } else if (!profil.objekttyp.length) {
    breakdown.objekttyp = 5;
  }

  if (profil.muss_kriterien.length) {
    const matched = profil.muss_kriterien.filter((criterion) =>
      mustCriterionMatches(criterion, object)
    );
    breakdown.muss_kriterien = matched.length * 5;
  }

  const score = Math.min(
    100,
    breakdown.preis +
      breakdown.zimmer +
      breakdown.lage +
      breakdown.objekttyp +
      breakdown.muss_kriterien
  );

  return { score, breakdown };
}

export function findMatchingSuchprofile(
  profile: SuchprofilRecord[],
  object: RealEstateObject,
  threshold = 70
): Array<{ profil: SuchprofilRecord; score: number; breakdown: MatchScoreBreakdown }> {
  return profile
    .map((profil) => {
      const { score, breakdown } = computeMatchScore(profil, object);
      return { profil, score, breakdown };
    })
    .filter((item) => item.score >= threshold)
    .sort((a, b) => b.score - a.score);
}
