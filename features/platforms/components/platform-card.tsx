"use client";

import { cn } from "@/lib/utils";
import {
  PlatformBrandLogo,
  type PlatformBrandId,
} from "@/features/platforms/components/platform-brand-logo";

export type PlatformCardStatus =
  | "verbunden"
  | "nicht_verbunden"
  | "fehler"
  | "bald_verfuegbar";

const STATUS_STYLES: Record<PlatformCardStatus, string> = {
  verbunden: "border-[#A7F3D0]/70 bg-[#ECFDF5] text-[#047857]",
  nicht_verbunden: "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
  fehler: "border-[#FECACA]/70 bg-[#FEF2F2] text-[#DC2626]",
  bald_verfuegbar: "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]",
};

const STATUS_LABELS: Record<PlatformCardStatus, string> = {
  verbunden: "Verbunden",
  nicht_verbunden: "Nicht verbunden",
  fehler: "Verbindung prüfen",
  bald_verfuegbar: "Bald verfügbar",
};

type PlatformCardProps = {
  brand: PlatformBrandId;
  name: string;
  description: string;
  status: PlatformCardStatus;
  account?: string | null;
  errorMessage?: string | null;
  actions: React.ReactNode;
  className?: string;
};

export function PlatformCard({
  brand,
  name,
  description,
  status,
  account,
  errorMessage,
  actions,
  className,
}: PlatformCardProps) {
  const connected = status === "verbunden";

  return (
    <article
      className={cn(
        "group flex h-full min-h-[240px] flex-col rounded-[20px] border bg-[var(--bg-surface)] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
        connected
          ? "border-[#BBF7D0]/80 ring-1 ring-[#DCFCE7]/60"
          : "border-[var(--border)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <PlatformBrandLogo brand={brand} />
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide",
            STATUS_STYLES[status]
          )}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      <h3 className="mt-4 text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
        {name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
        {description}
      </p>

      {connected && account?.trim() ? (
        <p className="mt-3 truncate rounded-[10px] bg-[var(--bg-elevated)] px-3 py-2 text-[11px] font-medium text-[var(--text-muted)]">
          {account.trim()}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-[10px] border border-[#FECACA]/60 bg-[#FEF2F2]/80 px-3 py-2 text-[11px] text-[#DC2626]">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-5">{actions}</div>
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
        "flex h-10 w-full items-center justify-center gap-1.5 rounded-[12px] text-[12px] font-semibold transition-colors",
        variant === "primary" &&
          "bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-60",
        variant === "outline" &&
          "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border)] hover:bg-[var(--bg-elevated)] disabled:opacity-60",
        variant === "disabled" &&
          "cursor-not-allowed border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]"
      )}
    >
      {children}
    </button>
  );
}
