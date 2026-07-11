"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { WhatsappIcon } from "@/features/whatsapp/components/whatsapp-icon";
import type { WhatsappMessage } from "@/features/whatsapp/types/whatsapp-types";
import { WHATSAPP_BRAND_COLOR } from "@/features/whatsapp/types/whatsapp-types";
import { cn } from "@/lib/utils";

type WhatsappMessageCardProps = {
  message: WhatsappMessage;
  selected?: boolean;
  onSelect: (message: WhatsappMessage) => void;
};

const STATUS_LABELS: Record<WhatsappMessage["status"], string> = {
  neu: "Neu",
  in_bearbeitung: "In Bearbeitung",
  erledigt: "Erledigt",
  archiviert: "Archiviert",
};

const STATUS_VARIANTS: Record<
  WhatsappMessage["status"],
  "neu" | "in-pruefung" | "erledigt" | "mittel"
> = {
  neu: "neu",
  in_bearbeitung: "in-pruefung",
  erledigt: "erledigt",
  archiviert: "mittel",
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return "—";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;

  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days === 1 ? "" : "en"}`;
}

function formatPhone(number: string): string {
  const digits = number.replace(/\D/g, "");
  return digits ? `+${digits}` : number;
}

export function WhatsappMessageCard({
  message,
  selected,
  onSelect,
}: WhatsappMessageCardProps) {
  const displayName = message.fromName ?? formatPhone(message.fromNumber);
  const preview = message.summary?.trim() || message.body.trim() || "—";
  const receivedLabel = formatRelativeTime(message.receivedAt);

  return (
    <button
      type="button"
      onClick={() => onSelect(message)}
      className={cn(
        "w-full rounded-[20px] border bg-white/80 p-5 text-left backdrop-blur-xl transition-all duration-200",
        selected
          ? "border-[#25D366]/40 shadow-md ring-1 ring-[#25D366]/20"
          : "border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10">
          <WhatsappIcon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#0F172A]">
              {displayName}
            </p>
            <StatusBadge
              variant={STATUS_VARIANTS[message.status]}
              label={STATUS_LABELS[message.status]}
            />
            {message.intentLabel ? (
              <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#64748B]">
                {message.intentLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#64748B]">
            {preview}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#94A3B8]">
            <span>{receivedLabel}</span>
            {message.customerName ? (
              <span style={{ color: WHATSAPP_BRAND_COLOR }}>
                Kunde: {message.customerName}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
