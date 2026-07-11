"use client";

import { Plus } from "lucide-react";
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

type ObjekteToolbarProps = {
  activeFilter: PortfolioObjectFilter;
  onFilterChange: (filter: PortfolioObjectFilter) => void;
  filterCounts: Record<PortfolioObjectFilter, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
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
        onAddObject ? (
          <Button
            type="button"
            variant="primary"
            className="h-8 shrink-0 gap-1.5 rounded-[10px] px-3 text-[12px]"
            onClick={onAddObject}
          >
            <Plus className="size-3.5" strokeWidth={2.5} />
            Objekt hinzufügen
          </Button>
        ) : null
      }
    />
  );
}
