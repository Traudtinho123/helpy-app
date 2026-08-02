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
    <div className="mt-4 rounded-[14px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
      <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--text-muted)] uppercase">
        Verlauf
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {visible.map((entry, index) => (
          <li
            key={`${entry.id}-${index}`}
            className="flex items-baseline gap-2.5 text-[11px] leading-relaxed text-[var(--text-secondary)]"
          >
            <span className="shrink-0 font-mono text-[10px] font-medium tabular-nums text-[var(--text-muted)]">
              {entry.time}
            </span>
            <span className="min-w-0 text-[var(--text-muted)]">{entry.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
