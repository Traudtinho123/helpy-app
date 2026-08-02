"use client";

import Link from "next/link";
import { Building2, MoreHorizontal } from "lucide-react";
import { ObjectImageCover } from "@/features/portfolio/components/object-image-cover";
import { getObjektPath } from "@/features/portfolio/services/portfolio-service";
import type { PortfolioObjectSummary } from "@/features/portfolio/types/objekt-portfolio-types";
import { cn } from "@/lib/utils";

type PortfolioObjectCardProps = {
  summary: PortfolioObjectSummary;
};

function statusStyles(statusLabel: string): string {
  const lower = statusLabel.toLowerCase();
  if (lower.includes("aktiv")) {
    return "bg-[var(--success-light)] text-[var(--success)]";
  }
  if (lower.includes("vermietet")) {
    return "bg-[var(--warning-light)] text-[var(--warning)]";
  }
  if (lower.includes("verkauft")) {
    return "bg-[var(--danger-light)] text-[var(--danger)]";
  }
  return "bg-[var(--bg-overlay)] text-[var(--text-muted)]";
}

export function PortfolioObjectCard({ summary }: PortfolioObjectCardProps) {
  const detailLine = [summary.zimmerLabel, summary.flaecheLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={getObjektPath(summary.objectId)}
      className="group block overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-accent)] hover:shadow-[var(--shadow-accent)]"
    >
      <div className="relative h-[180px] bg-[var(--bg-elevated)]">
        <ObjectImageCover
          coverImageUrl={summary.coverImageUrl}
          alt={summary.titel}
          variant="card"
          className="h-full"
        />
        {!summary.coverImageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)]">
            <Building2 className="size-10 opacity-40" />
          </div>
        ) : null}
        <span
          className={cn(
            "absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold",
            statusStyles(summary.statusLabel)
          )}
        >
          {summary.statusLabel}
        </span>
        <span className="absolute top-3 right-3 rounded-[8px] bg-black/70 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur-md">
          {summary.preis}
        </span>
      </div>

      <div className="p-4">
        <p className="truncate text-[15px] font-bold text-[var(--text-primary)]">
          {summary.titel}
        </p>
        <p className="mt-1 truncate text-[13px] text-[var(--text-secondary)]">
          {summary.adresse}
        </p>
        {detailLine ? (
          <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{detailLine}</p>
        ) : null}

        <p className="mt-3 text-[18px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          {summary.preis}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-[6px] border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
            📍 {summary.ort}
          </span>
          {summary.zimmerLabel ? (
            <span className="rounded-[6px] border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
              {summary.zimmerLabel}
            </span>
          ) : null}
          {summary.flaecheLabel ? (
            <span className="rounded-[6px] border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
              {summary.flaecheLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[12px] text-[var(--text-muted)]">
          <span>
            {summary.interessentenCount} Interessenten · {summary.besichtigungenCount}{" "}
            Besicht.
          </span>
          <MoreHorizontal className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          Zuletzt: {summary.letzteAktivitaet}
        </p>
      </div>
    </Link>
  );
}
