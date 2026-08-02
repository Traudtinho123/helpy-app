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

const STATUS_ICONS: Record<PlatformCardStatus, string> = {
  verbunden: "✅",
  nicht_verbunden: "○",
  fehler: "⚠️",
  bald_verfuegbar: "○",
};

type PlatformCardProps = {
  brand: PlatformBrandId;
  name: string;
  description: string;
  status: PlatformCardStatus;
  account?: string | null;
  syncLabel?: string | null;
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
  syncLabel,
  errorMessage,
  actions,
  className,
}: PlatformCardProps) {
  const connected = status === "verbunden";

  return (
    <article
      className={cn(
        "group rounded-[16px] border bg-[var(--bg-surface)] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200",
        "min-h-[72px] sm:min-h-[240px] sm:flex sm:flex-col sm:rounded-[20px] sm:p-5 sm:hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
        connected
          ? "border-[#BBF7D0]/80 sm:ring-1 sm:ring-[#DCFCE7]/60"
          : "border-[var(--border)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <PlatformBrandLogo brand={brand} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                {name}
              </h3>
              <span
                className="shrink-0 text-[18px] leading-none sm:hidden"
                aria-hidden
              >
                {STATUS_ICONS[status]}
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)] sm:mt-1.5 sm:line-clamp-2 sm:text-[12px]">
              {description}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "hidden shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide sm:inline",
            STATUS_STYLES[status]
          )}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      {connected && account?.trim() ? (
        <p className="mt-3 truncate text-[13px] font-medium text-[var(--text-primary)] sm:rounded-[10px] sm:bg-[var(--bg-elevated)] sm:px-3 sm:py-2 sm:text-[11px] sm:text-[var(--text-muted)]">
          {account.trim()}
        </p>
      ) : null}

      {connected && syncLabel ? (
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">{syncLabel}</p>
      ) : null}

      {!connected ? (
        <p className="mt-1 text-[12px] text-[var(--text-muted)] sm:hidden">
          {STATUS_LABELS[status]}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-[10px] border border-[#FECACA]/60 bg-[#FEF2F2]/80 px-3 py-2 text-[11px] text-[#DC2626]">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:mt-auto sm:pt-5">{actions}</div>
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
        "flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[10px] text-[14px] font-semibold transition-colors sm:h-10 sm:rounded-[12px] sm:text-[12px]",
        variant === "primary" &&
          "bg-[var(--accent)] px-3 py-3 text-white hover:opacity-90 disabled:opacity-60 sm:bg-[#2563EB] sm:py-0 sm:hover:bg-[#1D4ED8]",
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
