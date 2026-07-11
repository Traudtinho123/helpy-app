"use client";

import {
  EntityBrowserToolbar,
  type EntityBrowserFilterOption,
} from "@/components/entity-browser";
import {
  filterLabels,
  type CustomerFilter,
} from "@/features/customers/mock/mock-customers";
import type { ReactNode } from "react";

type KundenToolbarProps = {
  activeFilter: CustomerFilter;
  onFilterChange: (filter: CustomerFilter) => void;
  filterCounts: Record<CustomerFilter, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  trailing?: ReactNode;
};

const filterOrder: CustomerFilter[] = [
  "alle",
  "neu",
  "aktiv",
  "interessent",
  "bestandskunde",
];

const filters: EntityBrowserFilterOption<CustomerFilter>[] = filterOrder.map(
  (value) => ({
    value,
    label: filterLabels[value],
  })
);

export function KundenToolbar({
  activeFilter,
  onFilterChange,
  filterCounts,
  searchQuery,
  onSearchChange,
  trailing,
}: KundenToolbarProps) {
  return (
    <EntityBrowserToolbar
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Kunden suchen…"
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
      filterCounts={filterCounts}
      trailing={trailing}
    />
  );
}
