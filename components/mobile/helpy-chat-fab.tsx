"use client";

import { useState } from "react";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { SlideUpSheet } from "@/components/mobile/slide-up-sheet";
import { cn } from "@/lib/utils";

type HelpyChatFabProps = {
  panel: React.ReactNode;
  className?: string;
};

export function HelpyChatFab({ panel, className }: HelpyChatFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "helpy-layout-mobile-fab fixed z-[90] flex size-14 items-center justify-center rounded-full",
          "bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white",
          "shadow-[0_8px_28px_rgba(79,70,229,0.45)] transition-transform active:scale-95",
          "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4",
          "lg:hidden",
          className
        )}
        aria-label="HELPY öffnen"
      >
        <HelpyCharacter size={32} variant="head" animated={false} showLabel={false} />
      </button>

      <SlideUpSheet
        open={open}
        onClose={() => setOpen(false)}
        title="HELPY"
        maxHeight="88vh"
      >
        <div className="flex min-h-[50vh] flex-col">{panel}</div>
      </SlideUpSheet>
    </>
  );
}
