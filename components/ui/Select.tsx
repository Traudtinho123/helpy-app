import * as React from "react";

import { radiusClass } from "@/lib/design/radius";
import { cn } from "@/lib/utils";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-9 w-full min-w-0 appearance-none border border-[#CBD5E1]/60 bg-white px-3 py-2 text-[13px] text-[#0F172A] transition-colors outline-none",
        radiusClass.sm,
        "focus-visible:border-[#2563EB] focus-visible:ring-3 focus-visible:ring-[#2563EB]/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select };
