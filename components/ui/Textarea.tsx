import * as React from "react";

import { radiusClass } from "@/lib/design/radius";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[80px] w-full resize-none border border-[#CBD5E1]/60 bg-white px-3 py-2.5 text-[13px] text-[#0F172A] transition-colors outline-none",
        radiusClass.sm,
        "placeholder:text-[#94A3B8] focus-visible:border-[#2563EB] focus-visible:ring-3 focus-visible:ring-[#2563EB]/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
