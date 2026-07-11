"use client";

import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { IntakeTimelineEntry } from "@/features/brain/services/intake";
import { cn } from "@/lib/utils";

type HelpyActivityTimelineProps = {
  entries: IntakeTimelineEntry[];
  className?: string;
};

export function HelpyActivityTimeline({
  entries,
  className,
}: HelpyActivityTimelineProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Card
      className={cn(
        "rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl",
        className
      )}
    >
      <CardContent className="p-7 lg:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-[12px] bg-[#EFF6FF]">
            <Clock className="size-4 text-[#2563EB]" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[1.125rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
              HELPY Verlauf
            </h2>
            <p className="text-[12px] text-[#64748B]">Heute</p>
          </div>
        </div>

        <ol className="relative space-y-0">
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className="helpy-fade-in relative flex gap-4 pb-5 last:pb-0"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {index < entries.length - 1 && (
                <span className="absolute left-[3.35rem] top-6 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-[#BFDBFE] to-transparent" />
              )}
              <time className="w-10 shrink-0 pt-0.5 text-[12px] font-semibold tabular-nums text-[#2563EB]">
                {entry.time}
              </time>
              <span className="relative z-[1] mt-1.5 size-2 shrink-0 rounded-full bg-[#2563EB] ring-4 ring-[#EFF6FF]" />
              <p className="min-w-0 flex-1 pt-0.5 text-[13px] font-medium text-[#334155]">
                {entry.label}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
