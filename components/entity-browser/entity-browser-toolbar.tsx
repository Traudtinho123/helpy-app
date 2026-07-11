"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type EntityBrowserFilterOption<TFilter extends string> = {
  value: TFilter;
  label: string;
};

type EntityBrowserToolbarProps<TFilter extends string> = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder: string;
  filters: readonly EntityBrowserFilterOption<TFilter>[];
  activeFilter: TFilter;
  onFilterChange: (filter: TFilter) => void;
  filterCounts: Record<TFilter, number>;
  trailing?: React.ReactNode;
};

export function EntityBrowserToolbar<TFilter extends string>({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filters,
  activeFilter,
  onFilterChange,
  filterCounts,
  trailing,
}: EntityBrowserToolbarProps<TFilter>) {
  return (
    <div className="border-b border-[#CBD5E1]/50 bg-white/70 px-5 py-2.5 backdrop-blur-xl lg:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative w-full max-w-xs shrink-0">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 rounded-[10px] border-[#CBD5E1]/60 bg-white/90 pl-8 text-[12px] placeholder:text-[#94A3B8]"
          />
        </div>

        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.value;
            const count = filterCounts[filter.value];

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onFilterChange(filter.value)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-300",
                  isActive
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#334155]"
                )}
              >
                {filter.label}
                <span className="ml-1 tabular-nums opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </div>
  );
}
