"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  completed?: boolean;
  className?: string;
};

export function ActionButton({
  label,
  onClick,
  disabled = false,
  loading = false,
  completed = false,
  className,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || completed}
      className={cn(
        "group/action inline-flex w-full items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-[12px] font-semibold tracking-[-0.01em] transition-all duration-300",
        completed
          ? "cursor-default bg-[#ECFDF5] text-[#047857] shadow-none"
          : "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-[0_4px_16px_rgba(37,99,235,0.32)] hover:scale-[1.01] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />
          Wird vorbereitet…
        </>
      ) : completed ? (
        "Bestätigt ✓"
      ) : (
        <>
          {label}
          <ArrowRight
            className="size-3.5 transition-transform duration-300 group-hover/action:translate-x-0.5"
            strokeWidth={2.5}
          />
        </>
      )}
    </button>
  );
}
