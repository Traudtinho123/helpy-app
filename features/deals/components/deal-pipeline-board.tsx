"use client";

import { useCallback, useMemo, useState } from "react";
import { DealCard } from "@/features/deals/components/deal-card";
import {
  moveDealToPhase,
  pushDealNotification,
} from "@/features/deals/services/deal-client-store";
import type {
  DealPipelineAnalytics,
  DealType,
  DealWithRelations,
} from "@/features/deals/types/deal-types";
import { getDealPhases } from "@/features/deals/types/deal-types";
import { getStablePortfolioSummariesSnapshot } from "@/features/portfolio/services/portfolio-service";
import { cn } from "@/lib/utils";

type DealPipelineBoardProps = {
  deals: DealWithRelations[];
  dealType?: DealType;
  objektId?: string;
  onDealsChange?: () => void;
};

export function DealPipelineBoard({
  deals,
  dealType = "verkauf",
  onDealsChange,
}: DealPipelineBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const phases = getDealPhases(dealType);

  const objektTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const summary of getStablePortfolioSummariesSnapshot()) {
      map.set(summary.objectId, summary.titel);
    }
    return map;
  }, [deals.length]);

  const dealsByPhase = useMemo(() => {
    const grouped = new Map<number, DealWithRelations[]>();
    for (const phase of phases) {
      grouped.set(phase.phase, []);
    }
    for (const deal of deals) {
      const list = grouped.get(deal.phase) ?? [];
      list.push(deal);
      grouped.set(deal.phase, list);
    }
    return grouped;
  }, [deals, phases]);

  const handleDrop = useCallback(
    async (phase: number) => {
      if (!draggingId) return;
      const deal = deals.find((item) => item.id === draggingId);
      if (!deal || deal.phase === phase) {
        setDraggingId(null);
        setDropTarget(null);
        return;
      }

      const updated = await moveDealToPhase({
        dealId: draggingId,
        phase,
        beschreibung: `Manuell verschoben: Phase ${deal.phase} → ${phase}`,
      });

      if (updated && phase >= 5) {
        pushDealNotification(
          `🎉 ${updated.kunde_name ?? "Interessent"} → ${phases.find((p) => p.phase === phase)?.label ?? `Phase ${phase}`}`
        );
      }

      setDraggingId(null);
      setDropTarget(null);
      onDealsChange?.();
    },
    [draggingId, deals, onDealsChange, phases]
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-3">
        {phases.map((phase) => {
          const columnDeals = dealsByPhase.get(phase.phase) ?? [];
          const isTarget = dropTarget === phase.phase;

          return (
            <div
              key={phase.phase}
              className={cn(
                "flex w-[240px] shrink-0 flex-col rounded-[var(--radius-lg)] border bg-[var(--color-bg-subtle)]",
                isTarget
                  ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)]"
                  : "border-[var(--color-border)]"
              )}
              onDragOver={(event) => {
                event.preventDefault();
                setDropTarget(phase.phase);
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(event) => {
                event.preventDefault();
                void handleDrop(phase.phase);
              }}
            >
              <header className="border-b border-[var(--color-border)] px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[var(--text-sm)] font-semibold text-[var(--color-ink)]">
                    {phase.shortLabel}
                  </p>
                  <span className="rounded-[var(--radius-full)] bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-ink-3)]">
                    {columnDeals.length}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--color-ink-4)]">
                  {phase.label}
                </p>
              </header>

              <div className="flex flex-1 flex-col gap-2 p-2">
                {columnDeals.length === 0 ? (
                  <p className="px-2 py-6 text-center text-[12px] text-[var(--color-ink-4)]">
                    Keine Deals
                  </p>
                ) : (
                  columnDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      objektTitle={objektTitles.get(deal.objekt_id)}
                      lastContactLabel={new Intl.DateTimeFormat("de-DE", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(deal.updated_at))}
                      onDragStart={setDraggingId}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTarget(null);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { DealPipelineAnalytics };
