"use client";

import { useCallback, useEffect, useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { DealPipelineBoard } from "@/features/deals/components/deal-pipeline-board";
import {
  DealPipelineAnalyticsHeader,
  DealPipelineConversionStrip,
} from "@/features/deals/components/deal-pipeline-analytics";
import { fetchDeals } from "@/features/deals/services/deal-client-store";
import type {
  DealPipelineAnalytics,
  DealType,
  DealWithRelations,
} from "@/features/deals/types/deal-types";
import { cn } from "@/lib/utils";

export function DealPipelinePage() {
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [analytics, setAnalytics] = useState<DealPipelineAnalytics | null>(null);
  const [dealType, setDealType] = useState<DealType>("verkauf");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/deals", { cache: "no-store" });
      const data = (await response.json()) as {
        deals?: DealWithRelations[];
        analytics?: DealPipelineAnalytics;
      };
      setDeals(data.deals ?? []);
      setAnalytics(data.analytics ?? null);
      await fetchDeals();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredDeals = deals.filter((deal) => deal.deal_type === dealType);

  return (
    <DashboardShell activeHref="/pipeline">
      <div className="helpy-page py-6 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[var(--color-primary)]">
              <GitBranch className="size-5" />
              <span className="text-[var(--text-xs)] font-semibold uppercase tracking-[var(--tracking-wide)]">
                Deal-Pipeline
              </span>
            </div>
            <h1 className="helpy-display text-[var(--text-3xl)] font-semibold text-[var(--color-ink)]">
              Immobilien-Pipeline
            </h1>
            <p className="mt-2 max-w-2xl text-[var(--text-base)] text-[var(--color-ink-3)]">
              Kanban-Übersicht aller Interessenten — von der Anfrage bis zum Abschluss.
            </p>
          </div>

          <div className="flex gap-2">
            {(["verkauf", "vermietung"] as DealType[]).map((type) => (
              <Button
                key={type}
                type="button"
                variant={dealType === type ? "primary" : "secondary"}
                size="sm"
                onClick={() => setDealType(type)}
              >
                {type === "verkauf" ? "Verkauf" : "Vermietung"}
              </Button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--color-ink-3)]">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Pipeline wird geladen…
          </div>
        ) : (
          <div className="space-y-6">
            {analytics ? (
              <>
                <DealPipelineAnalyticsHeader analytics={analytics} dealType={dealType} />
                <DealPipelineConversionStrip analytics={analytics} dealType={dealType} />
              </>
            ) : null}

            {filteredDeals.length === 0 ? (
              <div
                className={cn(
                  "rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)]",
                  "bg-[var(--color-surface)] px-6 py-16 text-center"
                )}
              >
                <p className="text-[var(--text-lg)] font-semibold text-[var(--color-ink)]">
                  Noch keine Deals in der Pipeline
                </p>
                <p className="mt-2 text-[var(--text-sm)] text-[var(--color-ink-3)]">
                  Erstelle einen Deal aus einem Vorgang oder verknüpfe einen Interessenten mit einem Objekt.
                </p>
              </div>
            ) : (
              <DealPipelineBoard
                deals={filteredDeals}
                dealType={dealType}
                onDealsChange={() => void reload()}
              />
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
