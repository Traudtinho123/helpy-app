"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { forgetMemory, upsertMemory } from "@/features/memory/services/memory-store";
import { MEMORY_SOURCE_LABELS } from "@/features/memory/services";
import type { MemoryEntry } from "@/features/memory/services/types";
import { cn } from "@/lib/utils";

type MemoryCardProps = {
  entry: MemoryEntry;
  className?: string;
  onChanged?: () => void;
};

export function MemoryCard({ entry, className, onChanged }: MemoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [insight, setInsight] = useState(entry.insight);

  const handleForget = () => {
    if (!window.confirm("Diese Erinnerung wirklich vergessen?")) return;
    forgetMemory(entry.id);
    onChanged?.();
  };

  const handleSave = () => {
    upsertMemory({ ...entry, insight: insight.trim() || entry.insight });
    setIsEditing(false);
    onChanged?.();
  };

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
          {isEditing ? (
            <textarea
              value={insight}
              onChange={(event) => setInsight(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-[12px] border border-[#CBD5E1]/60 bg-[#F8FAFC] px-3 py-2 text-[12px] leading-relaxed text-[#334155] outline-none focus:border-[#7C3AED]/40"
            />
          ) : (
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
              {entry.insight}
            </p>
          )}
          <p className="mt-2.5 text-[11px] font-medium text-[#94A3B8]">
            Quelle: {MEMORY_SOURCE_LABELS[entry.source]}
          </p>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {isEditing ? (
          <Button
            type="button"
            onClick={handleSave}
            className="h-8 rounded-[10px] px-3 text-[11px] font-semibold"
          >
            Speichern
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="h-8 rounded-[10px] border-[#CBD5E1]/60 bg-white/80 px-3 text-[11px] font-semibold text-[#334155] hover:border-[#7C3AED]/30 hover:bg-[#FAF5FF] hover:text-[#6D28D9]"
          >
            <Pencil className="size-3" strokeWidth={2} />
            Bearbeiten
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={handleForget}
          className="h-8 rounded-[10px] border-[#CBD5E1]/60 bg-white/80 px-3 text-[11px] font-semibold text-[#64748B] hover:border-[#FECACA]/60 hover:bg-[#FEF2F2] hover:text-[#DC2626]"
        >
          <Trash2 className="size-3" strokeWidth={2} />
          Vergessen
        </Button>
      </div>
    </article>
  );
}
