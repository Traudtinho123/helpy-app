import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { cn } from "@/lib/utils";

type HelpyLogoProps = {
  size?: "sm" | "md" | "lg" | "sidebar";
  variant?: "light" | "dark";
  showSubtitle?: boolean;
  className?: string;
};

const sizeStyles = {
  sm: {
    character: 36,
    title: "text-[13px]",
    subtitle: "text-[10px]",
    gap: "gap-2.5",
  },
  md: {
    character: 44,
    title: "text-[15px]",
    subtitle: "text-[11px]",
    gap: "gap-3",
  },
  sidebar: {
    character: 52,
    title: "text-[26px] leading-none",
    subtitle: "text-[11px]",
    gap: "gap-3.5",
  },
  lg: {
    character: 56,
    title: "text-lg",
    subtitle: "text-xs",
    gap: "gap-3.5",
  },
} as const;

export function HelpyLogo({
  size = "md",
  variant = "dark",
  showSubtitle = true,
  className,
}: HelpyLogoProps) {
  const s = sizeStyles[size];
  const isLight = variant === "light";

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <HelpyCharacter
        size={s.character}
        variant="head"
        pose="wave"
        animated
        showLabel={false}
        className="drop-shadow-[0_8px_20px_rgba(99,102,241,0.28)]"
      />
      <div>
        <p
          className={cn(
            "font-semibold tracking-[-0.02em]",
            s.title,
            isLight ? "text-white" : "text-[var(--text-primary)]"
          )}
        >
          HELPY
        </p>
        {showSubtitle && (
          <p
            className={cn(
              "font-medium tracking-wide",
              s.subtitle,
              isLight ? "text-[var(--text-sidebar-muted)]" : "text-[var(--text-secondary)]"
            )}
          >
            Office KI
          </p>
        )}
      </div>
    </div>
  );
}
