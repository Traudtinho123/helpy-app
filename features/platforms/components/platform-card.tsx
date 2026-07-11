"use client";

import { cn } from "@/lib/utils";

export type PlatformCardStatus =
  | "verbunden"
  | "nicht_verbunden"
  | "fehler"
  | "bald_verfuegbar";

const STATUS_STYLES: Record<PlatformCardStatus, string> = {
  verbunden: "border-[#A7F3D0]/60 bg-[#ECFDF5]/80 text-[#047857]",
  nicht_verbunden: "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]",
  fehler: "border-[#FECACA]/60 bg-[#FEF2F2]/80 text-[#DC2626]",
  bald_verfuegbar: "border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8]",
};

const STATUS_LABELS: Record<PlatformCardStatus, string> = {
  verbunden: "Verbunden",
  nicht_verbunden: "Nicht verbunden",
  fehler: "Fehler",
  bald_verfuegbar: "Bald verfügbar",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="text-[#94A3B8]">{label}</span>
      <span className="truncate text-right font-medium text-[#334155]">{value}</span>
    </div>
  );
}

type PlatformCardProps = {
  emoji: string;
  name: string;
  description: string;
  status: PlatformCardStatus;
  account?: string | null;
  lastSync?: string | null;
  eventsToday?: number | null;
  errorMessage?: string | null;
  actions: React.ReactNode;
  className?: string;
};

export function PlatformCard({
  emoji,
  name,
  description,
  status,
  account,
  lastSync,
  eventsToday,
  errorMessage,
  actions,
  className,
}: PlatformCardProps) {
  return (
    <article
      className={cn(
        "flex h-full min-h-[320px] flex-col rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#F8FAFC] text-xl">
          {emoji}
        </span>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
            STATUS_STYLES[status]
          )}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      <h3 className="mt-4 text-[14px] font-semibold text-[#0F172A]">{name}</h3>
      <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[12px] leading-relaxed text-[#64748B]">
        {description}
      </p>

      <div className="mt-4 space-y-2 rounded-[12px] border border-[#F1F5F9] bg-[#F8FAFC]/80 px-3.5 py-3">
        <DetailRow label="Konto" value={account?.trim() || "—"} />
        <DetailRow label="Sync" value={lastSync?.trim() || "—"} />
        <DetailRow
          label="Heute"
          value={
            eventsToday !== null && eventsToday !== undefined
              ? String(eventsToday)
              : "—"
          }
        />
      </div>

      {errorMessage && (
        <p className="mt-3 rounded-[10px] border border-[#FECACA]/60 bg-[#FEF2F2]/80 px-3 py-2 text-[11px] text-[#DC2626]">
          {errorMessage}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4">{actions}</div>
    </article>
  );
}

export function PlatformCardButton({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline" | "disabled";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || variant === "disabled"}
      className={cn(
        "flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] text-[12px] font-semibold transition-colors",
        variant === "primary" &&
          "bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-60",
        variant === "outline" &&
          "border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-60",
        variant === "disabled" &&
          "cursor-not-allowed border border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8]"
      )}
    >
      {children}
    </button>
  );
}
