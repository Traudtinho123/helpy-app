import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type DividerProps = ComponentProps<"div"> & {
  label?: string;
};

function Divider({ className, label, ...props }: DividerProps) {
  if (label) {
    return (
      <div
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        <span className="h-px flex-1 bg-[#CBD5E1]/50" />
        <span className="text-[11px] font-medium text-[#94A3B8]">{label}</span>
        <span className="h-px flex-1 bg-[#CBD5E1]/50" />
      </div>
    );
  }

  return (
    <div
      className={cn("h-px w-full bg-[#CBD5E1]/50", className)}
      {...props}
    />
  );
}

export { Divider };
