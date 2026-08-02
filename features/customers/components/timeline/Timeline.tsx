"use client";

import { useMemo, useState } from "react";
import { TimelineFilters } from "@/features/customers/components/timeline/TimelineFilters";
import { TimelineItem } from "@/features/customers/components/timeline/TimelineItem";
import {
  filterTimelineEntries,
  getTimelineForCustomer,
  groupTimelineByDate,
  matchesTimelineFilter,
  TIMELINE_FILTERS,
} from "@/features/customers/services/timeline";
import type { TimelineEntry, TimelineFilter } from "@/features/customers/services/timeline/types";

type TimelineProps = {
  customerId: string;
  entries?: TimelineEntry[];
  maxGroups?: number;
};

function buildFilterCounts(entries: TimelineEntry[]) {
  return TIMELINE_FILTERS.reduce<Partial<Record<TimelineFilter, number>>>(
    (counts, filter) => {
      counts[filter] =
        filter === "alle"
          ? entries.length
          : entries.filter((entry) => matchesTimelineFilter(entry.type, filter))
              .length;
      return counts;
    },
    {}
  );
}

export function Timeline({
  customerId,
  entries: entriesProp,
  maxGroups = 4,
}: TimelineProps) {
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("alle");

  const allEntries = useMemo(
    () => entriesProp ?? getTimelineForCustomer(customerId),
    [customerId, entriesProp]
  );

  const filterCounts = useMemo(() => buildFilterCounts(allEntries), [allEntries]);

  const filteredEntries = useMemo(
    () => filterTimelineEntries(allEntries, activeFilter),
    [allEntries, activeFilter]
  );

  const groups = useMemo(
    () => groupTimelineByDate(filteredEntries).slice(0, maxGroups),
    [filteredEntries, maxGroups]
  );

  if (allEntries.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-6 py-10 text-center">
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">
          Noch keine Timeline-Einträge für diesen Kunden.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TimelineFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
      />

      {groups.length === 0 ? (
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-8 text-center">
          <p className="text-[13px] text-[var(--text-secondary)]">
            Keine Einträge für diesen Filter.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label}>
              <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
                {group.label}
              </p>
              <div>
                {group.entries.map((entry, index) => (
                  <TimelineItem
                    key={entry.id}
                    entry={entry}
                    isLast={index === group.entries.length - 1}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
