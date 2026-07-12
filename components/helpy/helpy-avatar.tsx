import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { cn } from "@/lib/utils";

type HelpyAvatarProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  pose?: "idle" | "wave" | "typing";
  animated?: boolean;
};

const pixelSize: Record<NonNullable<HelpyAvatarProps["size"]>, number> = {
  sm: 32,
  md: 40,
  lg: 52,
};

export function HelpyAvatar({
  size = "md",
  className,
  pose = "idle",
  animated = true,
}: HelpyAvatarProps) {
  const px = pixelSize[size];

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-visible",
        className
      )}
    >
      <HelpyCharacter
        size={px}
        variant="head"
        pose={pose}
        animated={animated}
        showLabel={false}
      />
      <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border-2 border-[var(--helpy-panel-bg,#fff)] bg-[#A5B4FC]" />
    </div>
  );
}
