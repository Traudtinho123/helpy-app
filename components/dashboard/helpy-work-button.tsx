"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HelpyWorkButtonState } from "@/features/workflow/services/helpy-work";
import { cn } from "@/lib/utils";

type HelpyWorkButtonProps = {
  buttonState: HelpyWorkButtonState;
  onClick: () => void;
  disabled?: boolean;
};

const stateConfig: Record<
  HelpyWorkButtonState,
  {
    emoji: string;
    statusLabel: string;
    buttonClass: string;
    statusClass: string;
  }
> = {
  current: {
    emoji: "🟢",
    statusLabel: "Alles aktuell",
    buttonClass:
      "border-[#A7F3D0]/60 bg-gradient-to-r from-[#ECFDF5] to-white text-[#047857] hover:from-[#ECFDF5] hover:to-[#ECFDF5] shadow-[0_4px_20px_rgba(16,185,129,0.15)]",
    statusClass: "text-[#047857]",
  },
  new_vorgaenge: {
    emoji: "🔵",
    statusLabel: "Neue Vorgänge vorhanden",
    buttonClass:
      "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.45)]",
    statusClass: "text-[#2563EB]",
  },
  updating: {
    emoji: "🧠",
    statusLabel: "HELPY aktualisiert…",
    buttonClass:
      "border-[#BFDBFE]/60 bg-gradient-to-r from-[#EFF6FF] to-white text-[#2563EB] opacity-90",
    statusClass: "text-[#2563EB]",
  },
};

export function HelpyWorkButton({
  buttonState,
  onClick,
  disabled,
}: HelpyWorkButtonProps) {
  const config = stateConfig[buttonState];
  const isUpdating = buttonState === "updating";

  return (
    <div className="space-y-2.5">
      <p
        className={cn(
          "flex items-center gap-2 text-[13px] font-semibold tracking-[-0.01em]",
          config.statusClass
        )}
      >
        <span className="text-[15px] leading-none">{config.emoji}</span>
        {config.statusLabel}
      </p>
      <Button
        onClick={onClick}
        disabled={disabled || isUpdating}
        className={cn(
          "h-12 w-full gap-2.5 rounded-[14px] text-[13px] font-semibold transition-all duration-300 disabled:opacity-90",
          config.buttonClass
        )}
      >
        {isUpdating ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            HELPY, let&apos;s work
          </>
        ) : (
          "HELPY, let's work"
        )}
      </Button>
    </div>
  );
}
