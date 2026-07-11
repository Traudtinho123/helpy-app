"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type EntityBrowserPickerProps<TItem> = {
  items: TItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  getItemId: (item: TItem) => string;
  getOptionLabel: (item: TItem) => string;
  renderCard: (item: TItem, isSelected: boolean) => React.ReactNode;
  title?: string;
  selectAriaLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Nur Dropdown — ohne Kartenleiste und Treffer-Header. */
  compact?: boolean;
  trailing?: React.ReactNode;
  /** Platzhalter-Option, wenn selectedId leer ist. */
  placeholderOption?: string;
};

export function EntityBrowserPicker<TItem>({
  items,
  selectedId,
  onSelect,
  getItemId,
  getOptionLabel,
  renderCard,
  title = "Auswählen",
  selectAriaLabel = "Eintrag auswählen",
  emptyTitle = "Keine Einträge gefunden.",
  emptyDescription = "Suche oder Filter anpassen.",
  compact = false,
  trailing,
  placeholderOption,
}: EntityBrowserPickerProps<TItem>) {
  if (items.length === 0) {
    return (
      <div className="border-b border-[#CBD5E1]/40 bg-white/50 px-5 py-3 lg:px-6">
        <p className="text-[13px] font-medium text-[#64748B]">{emptyTitle}</p>
        <p className="mt-0.5 text-[12px] text-[#94A3B8]">{emptyDescription}</p>
      </div>
    );
  }

  const selectControl = (
    <div className="relative min-w-0 flex-1">
      <select
        value={selectedId}
        onChange={(e) => {
          if (e.target.value) onSelect(e.target.value);
        }}
        aria-label={selectAriaLabel}
        className={cn(
          "w-full appearance-none border border-[#CBD5E1]/60 bg-white/90 pl-3",
          "font-medium text-[#0F172A] outline-none transition-colors",
          "focus-visible:border-[#2563EB] focus-visible:ring-3 focus-visible:ring-[#2563EB]/20",
          compact
            ? "h-8 rounded-[10px] py-1.5 pr-9 text-[12px]"
            : "h-9 rounded-[12px] py-2 pr-10 text-[13px]"
        )}
      >
        {placeholderOption && !selectedId ? (
          <option value="" disabled>
            {placeholderOption}
          </option>
        ) : null}
        {items.map((item) => {
          const id = getItemId(item);
          return (
            <option key={id} value={id}>
              {getOptionLabel(item)}
            </option>
          );
        })}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#94A3B8]",
          compact ? "right-2.5 size-3.5" : "right-3 size-4"
        )}
      />
    </div>
  );

  if (compact) {
    return (
      <div className="border-b border-[#CBD5E1]/40 bg-white/50 px-5 py-2 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 sm:max-w-md">{selectControl}</div>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[#CBD5E1]/40 bg-white/50 px-5 py-3 lg:px-6">
      <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            {title}
          </p>
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            {items.length} Treffer
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:max-w-xs">
          {selectControl}
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const id = getItemId(item);
          return (
            <div key={id} className="shrink-0">
              {renderCard(item, id === selectedId)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
