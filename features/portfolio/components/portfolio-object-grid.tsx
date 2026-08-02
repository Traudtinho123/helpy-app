"use client";

import { PortfolioObjectCard } from "@/features/portfolio/components/portfolio-object-card";
import type { PortfolioObjectSummary } from "@/features/portfolio/types/objekt-portfolio-types";

type PortfolioObjectGridProps = {
  summaries: PortfolioObjectSummary[];
};

export function PortfolioObjectGrid({ summaries }: PortfolioObjectGridProps) {
  if (summaries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-[var(--text-muted)]">
          Keine Objekte für diesen Filter gefunden.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3 lg:p-6">
      {summaries.map((summary) => (
        <PortfolioObjectCard key={summary.objectId} summary={summary} />
      ))}
    </div>
  );
}
