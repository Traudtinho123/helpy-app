"use client";

import { TIMELINE_FILTERS, TIMELINE_FILTER_LABELS } from "@/features/customers/services/timeline/config";
import type { TimelineFilter } from "@/features/customers/services/timeline/types";
import { cn } from "@/lib/utils";

type TimelineFiltersProps = {
  activeFilter: TimelineFilter;
  onFilterChange: (filter: TimelineFilter) => void;
  counts?: Partial<Record<TimelineFilter, number>>;
};

export function TimelineFilters({
  activeFilter,
  onFilterChange,
  counts,
}: TimelineFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIMELINE_FILTERS.map((filter) => {
        const isActive = activeFilter === filter;
        const count = counts?.[filter];

        return (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            className={cn(
              "h-8 rounded-full px-3.5 text-[12px] font-semibold transition-all duration-200",
              isActive
                ? "bg-[#0F172A] text-white shadow-[0_4px_12px_rgba(15,23,42,0.2)]"
                : "border border-[#CBD5E1]/60 bg-white/80 text-[#64748B] hover:border-[#94A3B8]/60 hover:text-[#334155]"
            )}
          >
            {TIMELINE_FILTER_LABELS[filter]}
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  isActive ? "text-white/70" : "text-[#94A3B8]"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
