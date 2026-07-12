import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { cn } from "@/lib/utils";

type HelpyIconBadgeProps = {
  size?: number;
  pose?: "idle" | "wave" | "typing";
  className?: string;
};

export function HelpyIconBadge({
  size = 24,
  pose = "typing",
  className,
}: HelpyIconBadgeProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#6366F1] to-[#4F46E5] shadow-[0_4px_12px_rgba(99,102,241,0.35)]",
        className
      )}
      style={{ width: size + 12, height: size + 12 }}
    >
      <HelpyCharacter
        size={size}
        variant="head"
        pose={pose}
        animated
        showLabel={false}
      />
    </div>
  );
}
