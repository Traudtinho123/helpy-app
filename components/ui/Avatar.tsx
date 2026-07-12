import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { radiusClass } from "@/lib/design/radius";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

const sizeClass: Record<AvatarSize, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
};

const headPixelSize: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
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
        className={cn("relative shrink-0 overflow-visible", sizeClass[size], className)}
      >
        <HelpyCharacter
          size={headPixelSize[size]}
          variant="head"
          animated
          showLabel={false}
        />
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
