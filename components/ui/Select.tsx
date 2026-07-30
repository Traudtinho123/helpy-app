import * as React from "react";

import { cn } from "@/lib/utils";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "min-h-10 w-full min-w-0 appearance-none rounded-[var(--radius-md)] border-[1.5px] border-[var(--color-border-strong)] bg-[var(--color-surface)] px-[14px] py-[9px] text-[var(--text-base)] text-[var(--color-ink)] transition-[border-color,box-shadow] duration-[var(--transition-fast)] outline-none",
        "focus-visible:border-[var(--color-primary)] focus-visible:shadow-[0_0_0_3px_var(--color-primary-light)]",
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
