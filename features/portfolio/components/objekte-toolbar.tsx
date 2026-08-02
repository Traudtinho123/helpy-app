"use client";

import { LayoutGrid, List, Plus } from "lucide-react";
import {
  EntityBrowserToolbar,
  type EntityBrowserFilterOption,
} from "@/components/entity-browser";
import { Button } from "@/components/ui/button";
import {
  PORTFOLIO_FILTER_ORDER,
  portfolioFilterLabels,
  type PortfolioObjectFilter,
} from "@/features/portfolio/services/portfolio-filters";
import { cn } from "@/lib/utils";

export type ObjekteViewMode = "grid" | "list";

type ObjekteToolbarProps = {
  activeFilter: PortfolioObjectFilter;
  onFilterChange: (filter: PortfolioObjectFilter) => void;
  filterCounts: Record<PortfolioObjectFilter, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode?: ObjekteViewMode;
  onViewModeChange?: (mode: ObjekteViewMode) => void;
  onAddObject?: () => void;
};

const filters: EntityBrowserFilterOption<PortfolioObjectFilter>[] =
  PORTFOLIO_FILTER_ORDER.map((value) => ({
    value,
    label: portfolioFilterLabels[value],
  }));

export function ObjekteToolbar({
  activeFilter,
  onFilterChange,
  filterCounts,
  searchQuery,
  onSearchChange,
  viewMode = "grid",
  onViewModeChange,
  onAddObject,
}: ObjekteToolbarProps) {
  return (
    <EntityBrowserToolbar
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Objekte suchen…"
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
      filterCounts={filterCounts}
      trailing={
        <div className="flex shrink-0 items-center gap-2">
          {onViewModeChange ? (
            <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5">
              <button
                type="button"
                title="Kacheln"
                onClick={() => onViewModeChange("grid")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  viewMode === "grid"
                    ? "bg-[var(--accent-light)] text-[var(--text-accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                type="button"
                title="Liste"
                onClick={() => onViewModeChange("list")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  viewMode === "list"
                    ? "bg-[var(--accent-light)] text-[var(--text-accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                <List className="size-3.5" />
              </button>
            </div>
          ) : null}
          {onAddObject ? (
            <Button
              type="button"
              variant="primary"
              className="h-8 shrink-0 gap-1.5 rounded-lg px-3 text-[12px]"
              onClick={onAddObject}
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
              Objekt hinzufügen
            </Button>
          ) : null}
        </div>
      }
    />
  );
}
