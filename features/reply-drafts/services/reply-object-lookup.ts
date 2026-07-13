import { ensurePortfolioSeed } from "@/features/portfolio/services/portfolio-service";
import { getAllRealEstateObjects } from "@/features/real-estate/object/object-memory";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import type { ReplyObjectLookupResult } from "@/features/reply-drafts/types/mail-analysis-types";

function normalizeLookup(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/strasse/g, "straße")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreObjectMatch(object: RealEstateObject, query: string): number {
  const normalizedQuery = normalizeLookup(query);
  const fields = [
    object.adresse,
    object.titel,
    object.ort,
    `${object.adresse} ${object.ort}`,
    object.beschreibung,
  ].map(normalizeLookup);

  let score = 0;
  for (const field of fields) {
    if (!field) continue;
    if (field === normalizedQuery) score += 12;
    else if (field.includes(normalizedQuery) || normalizedQuery.includes(field)) {
      score += 8;
    } else {
      const tokens = normalizedQuery.split(" ").filter((token) => token.length >= 3);
      const hits = tokens.filter((token) => field.includes(token)).length;
      score += hits * 2;
    }
  }

  return score;
}

function formatObjectSummary(object: RealEstateObject): string {
  const parts = [
    object.titel,
    object.zimmer ? `${object.zimmer} Zimmer` : null,
    object.wohnflaeche ?? null,
    object.preis ? `${object.preis}/Monat` : object.preis,
    object.verfuegbarkeit ? `verfügbar ${object.verfuegbarkeit}` : "verfügbar auf Anfrage",
  ].filter(Boolean);

  return `Das Objekt ${object.adresse} hat folgende Infos: ${parts.join(", ")}.`;
}

function toLookupResult(
  object: RealEstateObject,
  query: string
): ReplyObjectLookupResult {
  return {
    query,
    objectId: object.objectId,
    titel: object.titel,
    adresse: object.adresse,
    zimmer: object.zimmer,
    wohnflaeche: object.wohnflaeche,
    preis: object.preis,
    verfuegbarkeit: object.verfuegbarkeit ?? null,
    summaryLine: formatObjectSummary(object),
  };
}

export function lookupObjectsForMailQueries(
  queries: string[]
): ReplyObjectLookupResult[] {
  ensurePortfolioSeed();
  const objects = getAllRealEstateObjects().filter((object) => object.aktiv);
  const results: ReplyObjectLookupResult[] = [];
  const usedIds = new Set<string>();

  for (const query of queries) {
    const trimmed = query.trim();
    if (!trimmed) continue;

    const ranked = objects
      .map((object) => ({ object, score: scoreObjectMatch(object, trimmed) }))
      .filter((entry) => entry.score >= 4)
      .sort((a, b) => b.score - a.score);

    const best = ranked[0]?.object;
    if (!best || usedIds.has(best.objectId)) continue;

    usedIds.add(best.objectId);
    results.push(toLookupResult(best, trimmed));
  }

  return results.slice(0, 3);
}

export function formatObjectLookupBlock(
  lookups: ReplyObjectLookupResult[]
): string {
  if (lookups.length === 0) return "";
  return lookups.map((entry) => entry.summaryLine).join("\n");
}
