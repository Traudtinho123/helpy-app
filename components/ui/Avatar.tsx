import { Bot } from "lucide-react";

import { iconSizeClass } from "@/lib/design/animation";
import { radiusClass } from "@/lib/design/radius";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

const sizeClass: Record<AvatarSize, string> = {
  sm: "size-8",
  md: "size-9",
  lg: "size-11",
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
          "relative flex shrink-0 items-center justify-center bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-[0_4px_16px_rgba(37,99,235,0.3)]",
          radiusClass.sm,
          sizeClass[size],
          className
        )}
      >
        <Bot className={cn("text-white", iconClass[size])} strokeWidth={2.25} />
        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border-2 border-white bg-[#22D3EE]" />
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
        "flex shrink-0 items-center justify-center bg-[#EFF6FF] text-[11px] font-semibold text-[#2563EB]",
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
