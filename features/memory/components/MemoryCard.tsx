"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEMORY_SOURCE_LABELS } from "@/features/memory/services";
import type { MemoryEntry } from "@/features/memory/services/types";
import { cn } from "@/lib/utils";

type MemoryCardProps = {
  entry: MemoryEntry;
  className?: string;
};

export function MemoryCard({ entry, className }: MemoryCardProps) {
  return (
    <article
      className={cn(
        "rounded-[18px] border border-[#CBD5E1]/45 bg-white/90 p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:border-[#E9D5FF]/50 hover:shadow-[0_6px_20px_rgba(124,58,237,0.08)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            {entry.title}
          </h4>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
            {entry.insight}
          </p>
          <p className="mt-2.5 text-[11px] font-medium text-[#94A3B8]">
            Quelle: {MEMORY_SOURCE_LABELS[entry.source]}
          </p>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-[10px] border-[#CBD5E1]/60 bg-white/80 px-3 text-[11px] font-semibold text-[#334155] hover:border-[#7C3AED]/30 hover:bg-[#FAF5FF] hover:text-[#6D28D9]"
        >
          <Pencil className="size-3" strokeWidth={2} />
          Bearbeiten
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-[10px] border-[#CBD5E1]/60 bg-white/80 px-3 text-[11px] font-semibold text-[#64748B] hover:border-[#FECACA]/60 hover:bg-[#FEF2F2] hover:text-[#DC2626]"
        >
          <Trash2 className="size-3" strokeWidth={2} />
          Vergessen
        </Button>
      </div>
    </article>
  );
}
