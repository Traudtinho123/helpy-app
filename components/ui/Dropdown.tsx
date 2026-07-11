"use client";

import * as React from "react";

import { radiusClass } from "@/lib/design/radius";
import { shadowClass } from "@/lib/design/shadows";
import { cn } from "@/lib/utils";

type DropdownProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
};

function Dropdown({ trigger, children, align = "end", className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      <div onClick={() => setOpen((value) => !value)}>{trigger}</div>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-[calc(100%+8px)] z-[200] min-w-[12rem] border border-[#CBD5E1]/50 bg-white p-1.5",
            radiusClass.lg,
            shadowClass.lg,
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center rounded-[12px] px-3 py-2 text-left text-[13px] text-[#334155] transition-colors hover:bg-[#F8FAFC]",
        className
      )}
      {...props}
    />
  );
}

export { Dropdown, DropdownItem };
