"use client";

import { TimelineCard } from "@/features/customers/components/timeline/TimelineCard";
import type { TimelineEntry } from "@/features/customers/services/timeline/types";
import { cn } from "@/lib/utils";

type TimelineItemProps = {
  entry: TimelineEntry;
  isLast?: boolean;
};

export function TimelineItem({ entry, isLast = false }: TimelineItemProps) {
  return (
    <div className="relative flex gap-4">
      <div className="flex w-5 shrink-0 flex-col items-center pt-5">
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full ring-4 ring-white",
            entry.helpyDetected ? "bg-[#2563EB]" : "bg-[#CBD5E1]"
          )}
        />
        {!isLast && (
          <div className="mt-1 w-px flex-1 bg-gradient-to-b from-[#CBD5E1]/80 to-transparent" />
        )}
      </div>

      <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
        <TimelineCard entry={entry} />
      </div>
    </div>
  );
}
