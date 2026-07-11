"use client";

import {
  TIMELINE_STATUS_LABELS,
  TIMELINE_TYPE_CONFIG,
} from "@/features/customers/services/timeline/config";
import type { TimelineEntry } from "@/features/customers/services/timeline/types";
import { formatTimelineTime } from "@/features/customers/services/timeline/utils";
import { cn } from "@/lib/utils";

type TimelineCardProps = {
  entry: TimelineEntry;
  className?: string;
};

const statusStyles: Record<string, string> = {
  neu: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  offen: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  erledigt: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  versendet: "border-[#E9D5FF] bg-[#FAF5FF] text-[#7C3AED]",
  bestaetigt: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
};

export function TimelineCard({ entry, className }: TimelineCardProps) {
  const config = TIMELINE_TYPE_CONFIG[entry.type];

  return (
    <article
      className={cn(
        "rounded-[18px] border border-[#CBD5E1]/45 bg-white/90 p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:border-[#BFDBFE]/60 hover:shadow-[0_6px_20px_rgba(37,99,235,0.08)]",
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[14px] text-[18px] shadow-sm",
            config.bg
          )}
        >
          {config.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-[#94A3B8]">
              {formatTimelineTime(entry.time)}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                config.bg,
                config.accent
              )}
            >
              {config.label}
            </span>
            {entry.status && (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  statusStyles[entry.status]
                )}
              >
                {TIMELINE_STATUS_LABELS[entry.status]}
              </span>
            )}
          </div>

          <h4 className="mt-1.5 text-[13px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            {entry.title}
          </h4>

          <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">
            {entry.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-[#94A3B8]">
              {entry.source}
            </span>
            {entry.helpyDetected && (
              <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold text-[#2563EB]">
                Von HELPY erkannt
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
