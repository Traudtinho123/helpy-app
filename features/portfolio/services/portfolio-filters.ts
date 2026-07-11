import {
  REAL_ESTATE_OBJECT_STATUS_LABELS,
  type RealEstateObjectStatus,
} from "@/features/real-estate/object/object-types";
import type { PortfolioObjectSummary } from "@/features/portfolio/types/objekt-portfolio-types";

export type PortfolioObjectFilter = RealEstateObjectStatus | "alle";

export const PORTFOLIO_FILTER_ORDER: PortfolioObjectFilter[] = [
  "alle",
  "vorbereitet",
  "aktiv",
  "entwurf",
  "reserviert",
  "verkauft",
  "vermietet",
  "archiviert",
];

export const portfolioFilterLabels: Record<PortfolioObjectFilter, string> = {
  alle: "Alle",
  ...REAL_ESTATE_OBJECT_STATUS_LABELS,
};

export function getPortfolioFilterCounts(
  summaries: readonly PortfolioObjectSummary[]
): Record<PortfolioObjectFilter, number> {
  const counts = {
    alle: summaries.length,
    vorbereitet: 0,
    aktiv: 0,
    entwurf: 0,
    reserviert: 0,
    verkauft: 0,
    vermietet: 0,
    archiviert: 0,
  } satisfies Record<PortfolioObjectFilter, number>;

  for (const summary of summaries) {
    counts[summary.status] += 1;
  }

  return counts;
}

export function filterPortfolioSummaries(
  summaries: readonly PortfolioObjectSummary[],
  filter: PortfolioObjectFilter
): PortfolioObjectSummary[] {
  if (filter === "alle") {
    return [...summaries];
  }
  return summaries.filter((summary) => summary.status === filter);
}

export function searchPortfolioSummaries(
  summaries: readonly PortfolioObjectSummary[],
  query: string
): PortfolioObjectSummary[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...summaries];
  }

  return summaries.filter((summary) => {
    const haystack = [
      summary.titel,
      summary.adresse,
      summary.plz,
      summary.ort,
      summary.preis,
      summary.statusLabel,
      summary.quelle,
      summary.listingBadge ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}
