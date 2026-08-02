"use client";

import type { ChipFilter } from "@/features/gmail/mock/mock-emails";
import { cn } from "@/lib/utils";

const chips: { id: ChipFilter; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "ungelesen", label: "Ungelesen" },
  { id: "heute", label: "Heute" },
  { id: "diese-woche", label: "Diese Woche" },
  { id: "mit-termin", label: "Mit Termin" },
  { id: "mit-angebot", label: "Mit Angebot" },
  { id: "mit-rechnung", label: "Mit Rechnung" },
  { id: "dringend", label: "Dringend" },
];

type InboxFilterChipsProps = {
  activeChip: ChipFilter;
  onChipChange: (chip: ChipFilter) => void;
  counts: Record<ChipFilter, number>;
};

export function InboxFilterChips({
  activeChip,
  onChipChange,
  counts,
}: InboxFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-3 backdrop-blur-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map(({ id, label }) => {
        const isActive = activeChip === id;
        const count = counts[id];

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChipChange(id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all duration-300",
              isActive
                ? "bg-[#2563EB] text-white shadow-[0_2px_12px_rgba(37,99,235,0.35)]"
                : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
            )}
          >
            {label}
            {id !== "alle" && count > 0 && (
              <span
                className={cn(
                  "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                  isActive ? "bg-[var(--bg-surface)]/20 text-white" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
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
