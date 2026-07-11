import { SwissCrossIcon } from "@/components/privacy/swiss-cross-icon";
import { DATA_PRIVACY_TRUST_LINE } from "@/lib/privacy/data-privacy-copy";
import { cn } from "@/lib/utils";

type DataPrivacyTrustBadgeProps = {
  className?: string;
};

export function DataPrivacyTrustBadge({ className }: DataPrivacyTrustBadgeProps) {
  return (
    <p
      className={cn(
        "flex items-start justify-center gap-2 text-[11px] leading-relaxed text-[#94A3B8]",
        className
      )}
    >
      <SwissCrossIcon className="mt-0.5" />
      <span>{DATA_PRIVACY_TRUST_LINE}</span>
    </p>
  );
}
