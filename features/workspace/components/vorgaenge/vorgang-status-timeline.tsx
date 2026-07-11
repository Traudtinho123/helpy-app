"use client";

import type { StatusHistoryEntry } from "@/features/workspace/services/status";

type VorgangStatusTimelineProps = {
  entries: StatusHistoryEntry[];
  maxVisible?: number;
};

export function VorgangStatusTimeline({
  entries,
  maxVisible = 4,
}: VorgangStatusTimelineProps) {
  if (entries.length === 0) return null;

  const visible = entries.slice(-maxVisible);

  return (
    <div className="mt-4 rounded-[14px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/60 px-4 py-3">
      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
        Verlauf
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {visible.map((entry, index) => (
          <li
            key={`${entry.id}-${index}`}
            className="flex items-baseline gap-2.5 text-[11px] leading-relaxed text-[#64748B]"
          >
            <span className="shrink-0 font-mono text-[10px] font-medium tabular-nums text-[#94A3B8]">
              {entry.time}
            </span>
            <span className="min-w-0 text-[#475569]">{entry.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
