"use client";

import { Brain } from "lucide-react";
import { MEMORY_INTRO_PANEL } from "@/features/memory/services";

type HelpyMemoryRememberCardProps = {
  title?: string;
  intro?: string;
  bullets: string[];
};

export function HelpyMemoryRememberCard({
  title = "HELPY merkt sich",
  intro = MEMORY_INTRO_PANEL,
  bullets,
}: HelpyMemoryRememberCardProps) {
  if (bullets.length === 0) return null;

  return (
    <div className="mt-4 rounded-[16px] border border-[#E9D5FF]/50 bg-gradient-to-br from-[#FAF5FF]/80 to-white/90 px-4 py-3.5 shadow-[0_2px_12px_rgba(124,58,237,0.06)]">
      <div className="flex items-center gap-2">
        <Brain className="size-4 text-[#7C3AED]" strokeWidth={2} />
        <p className="text-[12px] font-semibold text-[#0F172A]">{title}</p>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-[#64748B]">{intro}</p>

      <div className="mt-3 rounded-[12px] border border-[#EDE9FE]/80 bg-white/70 px-3.5 py-3">
        <p className="mb-2 text-[11px] font-semibold text-[#6D28D9]">
          Ich merke mir:
        </p>
        <ul className="space-y-1.5">
          {bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex gap-2 text-[12px] leading-relaxed text-[#334155]"
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#7C3AED]" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
