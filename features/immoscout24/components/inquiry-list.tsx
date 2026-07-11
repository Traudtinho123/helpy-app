"use client";

import { Building2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  filterLabels,
  priorityStyles,
  statusStyles,
  type ImmoScoutInquiry,
  type InquiryFilter,
} from "@/features/immoscout24/mock/mock-inquiries";
import { cn } from "@/lib/utils";

type InquiryListProps = {
  inquiries: ImmoScoutInquiry[];
  selectedId: string;
  onSelect: (id: string) => void;
  activeFilter: InquiryFilter;
  onFilterChange: (filter: InquiryFilter) => void;
  filterCounts: Record<InquiryFilter, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

const filterOrder: InquiryFilter[] = [
  "alle",
  "neu",
  "in_bearbeitung",
  "besichtigung_geplant",
  "erledigt",
];

function InquiryListItem({
  inquiry,
  isSelected,
  onSelect,
}: {
  inquiry: ImmoScoutInquiry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const priority = priorityStyles[inquiry.prioritaet];
  const status = statusStyles[inquiry.status];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full gap-3.5 rounded-[16px] border p-3.5 text-left transition-all duration-300",
        isSelected
          ? "border-[#2563EB]/30 bg-white shadow-[0_2px_16px_rgba(37,99,235,0.12)] ring-1 ring-[#2563EB]/15"
          : "border-transparent bg-white/60 hover:-translate-y-0.5 hover:border-[#CBD5E1]/40 hover:bg-white hover:shadow-sm"
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-[0_4px_12px_rgba(37,99,235,0.25)]">
        <Building2 className="size-[18px] text-white" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            {inquiry.name}
          </p>
          <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", status.dot)} />
        </div>
        <p className="mt-0.5 truncate text-[12px] text-[#64748B]">
          {inquiry.objekt}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              priority.badge
            )}
          >
            {inquiry.prioritaet === "hoch"
              ? "Hoch"
              : inquiry.prioritaet === "mittel"
                ? "Mittel"
                : "Niedrig"}
          </span>
          <span className="text-[11px] font-medium text-[#94A3B8]">
            {inquiry.receivedLabel}
          </span>
        </div>
      </div>
    </button>
  );
}

export function InquiryList({
  inquiries,
  selectedId,
  onSelect,
  activeFilter,
  onFilterChange,
  filterCounts,
  searchQuery,
  onSearchChange,
}: InquiryListProps) {
  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-[#CBD5E1]/50 bg-white/60 backdrop-blur-xl xl:w-[340px]">
      <div className="border-b border-[#CBD5E1]/40 px-5 py-5">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#0F172A]">
          ImmoScout24.ch
        </h2>
        <p className="mt-0.5 text-[11px] font-medium text-[#64748B]">
          Alle Immobilienanfragen zentral verwalten.
        </p>

        <div className="relative mt-4">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Anfragen suchen…"
            className="h-10 rounded-[12px] border-[#CBD5E1]/60 bg-white/90 pl-9 text-[13px] placeholder:text-[#94A3B8]"
          />
        </div>
      </div>

      <div className="border-b border-[#CBD5E1]/40 px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {filterOrder.map((filter) => {
            const isActive = activeFilter === filter;
            const count = filterCounts[filter];

            return (
              <button
                key={filter}
                type="button"
                onClick={() => onFilterChange(filter)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-300",
                  isActive
                    ? "border-[#2563EB]/30 bg-[#EFF6FF] text-[#2563EB] shadow-sm"
                    : "border-transparent bg-white/80 text-[#64748B] hover:border-[#CBD5E1]/60 hover:bg-white"
                )}
              >
                {filterLabels[filter]}
                <span className="ml-1 tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-2">
          {inquiries.length === 0 ? (
            <p className="px-2 py-8 text-center text-[12px] text-[#94A3B8]">
              Keine Anfragen gefunden.
            </p>
          ) : (
            inquiries.map((inquiry) => (
              <InquiryListItem
                key={inquiry.id}
                inquiry={inquiry}
                isSelected={selectedId === inquiry.id}
                onSelect={() => onSelect(inquiry.id)}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
