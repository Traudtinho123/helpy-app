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
      className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm"
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
          "flex max-h-[90vh] w-full flex-col overflow-hidden",
          maxWidthClass[maxWidth],
          surfaces.modalCard,
          "rounded-[24px] shadow-[0_24px_64px_rgba(15,23,42,0.18)]",
          className
        )}
      >
        <div className="flex items-start justify-between border-b border-[#CBD5E1]/40 px-6 py-5">
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
            className="size-9"
            aria-label="Schließen"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

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
