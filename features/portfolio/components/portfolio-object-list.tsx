"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { ObjectImageCover } from "@/features/portfolio/components/object-image-cover";
import { getObjektPath } from "@/features/portfolio/services/portfolio-service";
import type { PortfolioObjectSummary } from "@/features/portfolio/types/objekt-portfolio-types";
import { cn } from "@/lib/utils";

type PortfolioObjectListProps = {
  summaries: PortfolioObjectSummary[];
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

export function PortfolioObjectList({ summaries }: PortfolioObjectListProps) {
  if (summaries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-[var(--text-muted)]">
          Keine Objekte für diesen Filter gefunden.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 overflow-x-auto px-4 lg:px-6">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            <th className="py-3 pr-3 font-semibold">Bild</th>
            <th className="py-3 pr-3 font-semibold">Adresse</th>
            <th className="py-3 pr-3 font-semibold">Typ</th>
            <th className="py-3 pr-3 font-semibold">Preis</th>
            <th className="py-3 pr-3 font-semibold">Status</th>
            <th className="py-3 pr-3 font-semibold">Interessenten</th>
            <th className="py-3 pr-3 font-semibold">Letzte Aktivität</th>
            <th className="py-3 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {summaries.map((summary) => (
            <tr
              key={summary.objectId}
              className="group border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-elevated)]"
            >
              <td className="py-3 pr-3">
                <Link
                  href={getObjektPath(summary.objectId)}
                  className="block size-12 overflow-hidden rounded-lg bg-[var(--bg-elevated)]"
                >
                  <ObjectImageCover
                    coverImageUrl={summary.coverImageUrl}
                    alt={summary.titel}
                    variant="thumb"
                    className="size-12"
                  />
                </Link>
              </td>
              <td className="py-3 pr-3">
                <Link
                  href={getObjektPath(summary.objectId)}
                  className="block min-w-0"
                >
                  <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                    {summary.titel}
                  </p>
                  <p className="truncate text-[12px] text-[var(--text-muted)]">
                    {summary.adresse}
                  </p>
                </Link>
              </td>
              <td className="py-3 pr-3 text-[12px] text-[var(--text-secondary)]">
                {summary.listingBadge ?? summary.transaktion ?? "—"}
              </td>
              <td className="py-3 pr-3 text-[13px] font-semibold text-[var(--text-primary)]">
                {summary.preis}
              </td>
              <td className="py-3 pr-3">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                    statusStyles(summary.statusLabel)
                  )}
                >
                  {summary.statusLabel}
                </span>
              </td>
              <td className="py-3 pr-3 text-[12px] text-[var(--text-secondary)]">
                {summary.interessentenCount}
              </td>
              <td className="py-3 pr-3 text-[12px] text-[var(--text-muted)]">
                {summary.letzteAktivitaet}
              </td>
              <td className="py-3 text-right">
                <Link
                  href={getObjektPath(summary.objectId)}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--bg-overlay)] group-hover:opacity-100"
                >
                  <MoreHorizontal className="size-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
