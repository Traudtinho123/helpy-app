"use client";

import * as React from "react";

import { radiusClass } from "@/lib/design/radius";
import { cn } from "@/lib/utils";

type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

function Tabs({ items, value, onValueChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {items.map((item) => {
        const isActive = item.id === value;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange(item.id)}
            className={cn(
              "h-8 px-3.5 text-[12px] font-medium transition-all duration-300",
              radiusClass.sm,
              isActive
                ? "bg-[#2563EB] text-white shadow-sm"
                : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function TabsPanel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="tabpanel"
      className={cn("mt-4", className)}
      {...props}
    />
  );
}

export { Tabs, TabsPanel };
export type { TabItem };
