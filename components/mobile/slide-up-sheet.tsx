"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type SlideUpSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Maximale Höhe — Standard 85vh */
  maxHeight?: string;
};

export function SlideUpSheet({
  open,
  onClose,
  title,
  children,
  className,
  maxHeight = "85vh",
}: SlideUpSheetProps) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setDragY(0);
      setDragging(false);
    }
  }, [open]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartY.current = event.touches[0]?.clientY ?? 0;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!dragging) return;
    const delta = (event.touches[0]?.clientY ?? 0) - touchStartY.current;
    if (delta > 0) setDragY(delta);
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  }, [dragY, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex flex-col justify-end bg-[#0F172A]/40 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-t-[24px] border border-[#E2E8F0]/80 bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.15)]",
          className
        )}
        style={{
          maxHeight,
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? "none" : "transform 0.25s ease-out",
        }}
      >
        <div
          className="flex shrink-0 cursor-grab flex-col items-center border-b border-[#E2E8F0]/60 px-4 pb-3 pt-3 active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mb-3 h-1 w-10 rounded-full bg-[#CBD5E1]" />
          {title ? (
            <div className="flex w-full items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[#0F172A]">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex size-11 items-center justify-center rounded-[12px] text-[#64748B] hover:bg-[#F1F5F9]"
                aria-label="Schliessen"
              >
                <X className="size-5" />
              </button>
            </div>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
