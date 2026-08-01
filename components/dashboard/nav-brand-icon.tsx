import { WhatsAppBrandIcon } from "@/features/platforms/components/platform-brand-logo";
import type { NavBrandIconId } from "@/lib/navigation/core-navigation";
import { cn } from "@/lib/utils";

export function NavBrandIcon({
  brand,
  className,
}: {
  brand: NavBrandIconId;
  className?: string;
}) {
  if (brand === "whatsapp") {
    return <WhatsAppBrandIcon className={cn("size-[18px]", className)} />;
  }

  return null;
}
