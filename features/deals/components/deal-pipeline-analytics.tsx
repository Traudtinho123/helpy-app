"use client";

import type {
  DealPipelineAnalytics,
  DealType,
  DealWithRelations,
} from "@/features/deals/types/deal-types";
import { getDealPhases } from "@/features/deals/types/deal-types";
import { cn } from "@/lib/utils";

type DealPipelineAnalyticsHeaderProps = {
  analytics: DealPipelineAnalytics;
  dealType: DealType;
};

export function DealPipelineAnalyticsHeader({
  analytics,
  dealType,
}: DealPipelineAnalyticsHeaderProps) {
  const phases = getDealPhases(dealType);
  const topConversion = analytics.conversionRates
    .filter((item) => item.fromPhase <= 3)
    .sort((a, b) => b.rate - a.rate)[0];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        {
          label: "Offene Deals",
          value: String(analytics.openDeals),
          sub: "Aktiv in der Pipeline",
        },
        {
          label: "Abgeschlossen (Monat)",
          value: String(analytics.closedThisMonth),
          sub: "Phase 9 erreicht",
        },
        {
          label: "Offener Wert",
          value: `CHF ${analytics.totalOpenValueChf.toLocaleString("de-CH")}`,
          sub: "Provisionen ausstehend",
        },
        {
          label: "Conversion",
          value: topConversion ? `${topConversion.rate}%` : "—",
          sub: topConversion
            ? `${phases.find((p) => p.phase === topConversion.fromPhase)?.shortLabel ?? ""} → ${phases.find((p) => p.phase === topConversion.toPhase)?.shortLabel ?? ""}`
            : "Noch keine Daten",
        },
      ].map((item) => (
        <div
          key={item.label}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-[var(--shadow-sm)]"
        >
          <p className="text-[var(--text-xs)] font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--color-ink-4)]">
            {item.label}
          </p>
          <p className="mt-2 text-[28px] font-extrabold tracking-[var(--tracking-tight)] text-[var(--color-ink)]">
            {item.value}
          </p>
          <p className="mt-1 text-[var(--text-xs)] text-[var(--color-ink-3)]">
            {item.sub}
          </p>
        </div>
      ))}
    </section>
  );
}

export function DealPipelineConversionStrip({
  analytics,
  dealType,
}: DealPipelineAnalyticsHeaderProps) {
  const phases = getDealPhases(dealType).slice(0, 5);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3">
      <p className="mb-2 text-[var(--text-xs)] font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--color-ink-4)]">
        Conversion pro Phase
      </p>
      <div className="flex flex-wrap gap-2">
        {phases.map((phase) => {
          const rate =
            analytics.conversionRates.find((item) => item.fromPhase === phase.phase)
              ?.rate ?? 0;
          return (
            <div
              key={phase.phase}
              className="min-w-[88px] rounded-[var(--radius-md)] bg-[var(--color-surface)] px-2.5 py-2 text-center"
            >
              <p className="text-[10px] text-[var(--color-ink-4)]">{phase.shortLabel}</p>
              <p
                className={cn(
                  "text-[14px] font-bold",
                  rate >= 50
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-ink-2)]"
                )}
              >
                {rate}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
