import { cn } from "@/lib/utils";

type SwissCrossIconProps = {
  className?: string;
};

/** Kleines Schweizer Kreuz für Trust-Badges. */
export function SwissCrossIcon({ className }: SwissCrossIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-3.5 shrink-0", className)}
      aria-hidden
    >
      <rect width="16" height="16" rx="2" fill="#DC2626" />
      <rect x="6.5" y="3" width="3" height="10" fill="white" />
      <rect x="3" y="6.5" width="10" height="3" fill="white" />
    </svg>
  );
}
