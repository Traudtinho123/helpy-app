import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

type HelpyLogoProps = {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showSubtitle?: boolean;
  className?: string;
};

const sizeStyles = {
  sm: {
    icon: "size-8 rounded-[10px]",
    bot: "size-4",
    title: "text-[13px]",
    subtitle: "text-[10px]",
    gap: "gap-2.5",
  },
  md: {
    icon: "size-10 rounded-[14px]",
    bot: "size-[18px]",
    title: "text-[15px]",
    subtitle: "text-[11px]",
    gap: "gap-3",
  },
  lg: {
    icon: "size-12 rounded-[16px]",
    bot: "size-6",
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
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] shadow-lg shadow-[#2563EB]/40 transition-transform duration-500 hover:scale-[1.04]",
          s.icon
        )}
      >
        <Bot className={cn("text-white", s.bot)} strokeWidth={2} />
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/15 to-transparent" />
        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border-2 border-[#0F172A] bg-[#22D3EE]" />
      </div>
      <div>
        <p
          className={cn(
            "font-semibold tracking-[-0.02em]",
            s.title,
            isLight ? "text-white" : "text-[#0F172A]"
          )}
        >
          HELPY
        </p>
        {showSubtitle && (
          <p
            className={cn(
              "font-medium tracking-wide",
              s.subtitle,
              isLight ? "text-blue-200/80" : "text-[#64748B]"
            )}
          >
            Office KI
          </p>
        )}
      </div>
    </div>
  );
}
