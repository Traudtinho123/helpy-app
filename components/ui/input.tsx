import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "min-h-10 w-full min-w-0 rounded-[var(--radius-md)] border-[1.5px] border-[var(--color-border-strong)] bg-[var(--color-surface)] px-[14px] py-[9px] text-[var(--text-base)] text-[var(--color-ink)] transition-[border-color,box-shadow] duration-[var(--transition-fast)] outline-none",
        "placeholder:text-[var(--color-ink-4)] focus-visible:border-[var(--color-primary)] focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_var(--color-primary-light)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
