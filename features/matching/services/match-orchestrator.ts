import type {
  MatchScoreBreakdown,
  ObjektMatchWithKunde,
  SuchprofilRecord,
} from "@/features/matching/types/matching-types";
import { MATCH_THRESHOLD } from "@/features/matching/types/matching-types";
import { findMatchingSuchprofile } from "@/features/matching/services/matching-engine";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";

export type KundeContactInfo = {
  name: string;
  email?: string;
  telefon?: string;
};

export function buildMatchRecordsForObject(
  object: RealEstateObject,
  suchprofile: SuchprofilRecord[],
  kundeNames?: Map<string, KundeContactInfo>,
  existingKeys?: Set<string>
): ObjektMatchWithKunde[] {
  const results = findMatchingSuchprofile(
    suchprofile.filter((item) => item.aktiv),
    object,
    MATCH_THRESHOLD
  );

  const now = new Date().toISOString();
  const matches: ObjektMatchWithKunde[] = [];

  for (const result of results) {
    const key = `${object.objectId}:${result.profil.kunde_id}:${result.profil.id}`;
    if (existingKeys?.has(key)) continue;

    const kundeInfo = kundeNames?.get(result.profil.kunde_id);
    matches.push({
      id: `match-${Date.now()}-${result.profil.kunde_id}`,
      company_id: result.profil.company_id,
      objekt_id: object.objectId,
      kunde_id: result.profil.kunde_id,
      suchprofil_id: result.profil.id,
      score: result.score,
      score_details: result.breakdown,
      notified: false,
      kontaktiert: false,
      created_at: now,
      kunde_name: kundeInfo?.name ?? null,
      kunde_email: kundeInfo?.email ?? null,
      kunde_telefon: kundeInfo?.telefon ?? null,
    });
  }

  return matches;
}

export function summarizeMatchBreakdown(breakdown: MatchScoreBreakdown): string {
  const parts = [
    breakdown.preis > 0 && `Preis +${breakdown.preis}%`,
    breakdown.zimmer > 0 && `Zimmer +${breakdown.zimmer}%`,
    breakdown.lage > 0 && `Lage +${breakdown.lage}%`,
    breakdown.objekttyp > 0 && `Typ +${breakdown.objekttyp}%`,
    breakdown.muss_kriterien > 0 && `Kriterien +${breakdown.muss_kriterien}%`,
  ].filter(Boolean);

  return parts.join(" · ");
}
