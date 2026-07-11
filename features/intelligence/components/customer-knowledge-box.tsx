"use client";

import { Brain } from "lucide-react";

type CustomerKnowledgeBoxProps = {
  memorySummary: string | null;
};

export function CustomerKnowledgeBox({ memorySummary }: CustomerKnowledgeBoxProps) {
  if (!memorySummary?.trim()) return null;

  return (
    <div className="rounded-[16px] border border-[#E9D5FF]/50 bg-gradient-to-br from-[#FAF5FF]/80 to-white/90 px-4 py-3.5 shadow-[0_2px_12px_rgba(124,58,237,0.06)]">
      <div className="flex items-center gap-2">
        <Brain className="size-4 text-[#7C3AED]" strokeWidth={2} />
        <p className="text-[12px] font-semibold text-[#0F172A]">
          Wissen über diesen Kunden
        </p>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">
        {memorySummary}
      </p>
    </div>
  );
}
