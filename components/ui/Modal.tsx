"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { surfaces } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  className?: string;
  maxWidth?: "sm" | "md" | "lg";
};

const maxWidthClass = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  className,
  maxWidth = "md",
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-[#0F172A]/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="helpy-modal-title"
        className={cn(
          "flex max-h-[85vh] w-full flex-col overflow-hidden sm:max-h-[90vh]",
          maxWidthClass[maxWidth],
          surfaces.modalCard,
          "rounded-t-[24px] shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:rounded-[24px]",
          className
        )}
      >
        <div className="flex shrink-0 flex-col items-center border-b border-[#CBD5E1]/40 px-6 pb-4 pt-3 sm:items-stretch sm:pb-0 sm:pt-0">
          <div className="mb-3 h-1 w-10 rounded-full bg-[#CBD5E1] sm:hidden" />
          <div className="flex w-full items-start justify-between sm:px-0 sm:py-5">
            <div>
              <h2 id="helpy-modal-title" className="text-[14px] font-semibold text-[#0F172A]">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-[13px] text-[#64748B]">{description}</p>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={onClose}
              className="size-11 sm:size-9"
              aria-label="Schließen"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>

        {footer && (
          <div className="border-t border-[#CBD5E1]/40 bg-[#F8FAFC]/80 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export { Modal };
