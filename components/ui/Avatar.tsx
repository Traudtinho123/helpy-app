import { Bot } from "lucide-react";

import { iconSizeClass } from "@/lib/design/animation";
import { radiusClass } from "@/lib/design/radius";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

const sizeClass: Record<AvatarSize, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
};

const iconClass: Record<AvatarSize, string> = {
  sm: iconSizeClass.sm,
  md: "size-[18px]",
  lg: iconSizeClass.lg,
};

type AvatarProps = {
  size?: AvatarSize;
  className?: string;
  /** HELPY Bot-Avatar (Standard) */
  helpy?: boolean;
  src?: string;
  alt?: string;
  name?: string;
};

function Avatar({
  size = "md",
  className,
  helpy = true,
  src,
  alt,
  name,
}: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name ?? "Avatar"}
        className={cn(sizeClass[size], radiusClass.sm, "shrink-0 object-cover", className)}
      />
    );
  }

  if (helpy) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--button-primary-from)] to-[var(--button-primary-to)] shadow-[var(--button-primary-shadow)]",
          sizeClass[size],
          className
        )}
      >
        <Bot className={cn("text-white", iconClass[size])} strokeWidth={2.25} />
        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border-2 border-[var(--helpy-panel-bg)] bg-[var(--accent-violet)]" />
      </div>
    );
  }

  const initials = (name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-[var(--primary-light)] text-[11px] font-semibold text-[var(--primary)]",
        radiusClass.sm,
        sizeClass[size],
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

export { Avatar };
