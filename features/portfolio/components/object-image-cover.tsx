"use client";

import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ObjectImageCoverProps = {
  coverImageUrl?: string | null;
  alt: string;
  variant?: "card" | "hero";
  className?: string;
};

export function ObjectImageCover({
  coverImageUrl,
  alt,
  variant = "card",
  className,
}: ObjectImageCoverProps) {
  const heightClass = variant === "hero" ? "h-44" : "h-36";

  if (coverImageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-[#F8FAFC]", heightClass, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImageUrl}
          alt={alt}
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#DBEAFE]/60",
        heightClass,
        className
      )}
    >
      <ImageIcon className="size-8 text-[#93C5FD]" strokeWidth={1.5} />
      <span
        className={cn(
          "absolute rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-[#64748B]",
          variant === "hero" ? "bottom-3 left-4" : "bottom-2 left-3"
        )}
      >
        Noch kein Titelbild
      </span>
    </div>
  );
}
