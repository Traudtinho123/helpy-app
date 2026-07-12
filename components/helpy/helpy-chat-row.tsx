import type { ReactNode } from "react";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import type { HelpyCharacterPose } from "@/components/helpy/helpy-character";
import { cn } from "@/lib/utils";

type HelpyChatRowProps = {
  label?: string;
  pose?: HelpyCharacterPose;
  children: ReactNode;
  className?: string;
};

export function HelpyChatRow({
  label = "HELPY",
  pose = "typing",
  children,
  className,
}: HelpyChatRowProps) {
  return (
    <div className={cn("helpy-fade-in-slide flex gap-3.5", className)}>
      <HelpyAvatar size="sm" pose={pose} />
      <div className="min-w-0 flex-1">
        <p className="helpy-label mb-2 normal-case tracking-normal">{label}</p>
        {children}
      </div>
    </div>
  );
}
