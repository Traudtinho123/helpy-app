import * as React from "react";

import { radiusClass } from "@/lib/design/radius";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[80px] w-full resize-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] transition-colors outline-none",
        radiusClass.sm,
        "placeholder:text-[var(--text-muted)] focus-visible:border-[#2563EB] focus-visible:ring-3 focus-visible:ring-[#2563EB]/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
