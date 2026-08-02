"use client";

import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ObjectImageCoverProps = {
  coverImageUrl?: string | null;
  alt: string;
  variant?: "card" | "hero" | "thumb";
  className?: string;
};

export function ObjectImageCover({
  coverImageUrl,
  alt,
  variant = "card",
  className,
}: ObjectImageCoverProps) {
  const heightClass =
    variant === "hero" ? "h-44" : variant === "thumb" ? "h-full" : "h-36";

  if (coverImageUrl) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-[var(--bg-elevated)]",
          heightClass,
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImageUrl} alt={alt} className="size-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-[var(--bg-elevated)]",
        heightClass,
        className
      )}
    >
      <ImageIcon className="size-6 text-[var(--text-muted)]" strokeWidth={1.5} />
      {variant !== "thumb" ? (
        <span
          className={cn(
            "absolute rounded-full border border-[var(--border)] bg-[var(--bg-overlay)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]",
            variant === "hero" ? "bottom-3 left-4" : "bottom-2 left-3"
          )}
        >
          Noch kein Titelbild
        </span>
      ) : null}
    </div>
  );
}
