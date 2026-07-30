"use client";

import type { DealWithRelations } from "@/features/deals/types/deal-types";
import { getLeadScoreRecord } from "@/features/lead-scoring/services/lead-score-store";
import { cn } from "@/lib/utils";

type DealCardProps = {
  deal: DealWithRelations;
  objektTitle?: string;
  lastContactLabel?: string;
  onDragStart?: (dealId: string) => void;
  onDragEnd?: () => void;
  onClick?: (deal: DealWithRelations) => void;
};

function leadScoreColor(score: number): string {
  if (score >= 8) return "bg-[var(--color-success)]";
  if (score >= 5) return "bg-[var(--color-warning)]";
  return "bg-[var(--color-ink-4)]";
}

export function DealCard({
  deal,
  objektTitle,
  lastContactLabel,
  onDragStart,
  onDragEnd,
  onClick,
}: DealCardProps) {
  const leadScore =
    deal.kunde_id != null
      ? (getLeadScoreRecord(deal.kunde_id)?.score ?? 5)
      : 5;

  const provisionLabel =
    deal.provision_chf && deal.provision_prozent
      ? `Provision: ${deal.provision_prozent} % = CHF ${deal.provision_chf.toLocaleString("de-CH")}`
      : deal.provision_chf
        ? `Provision: CHF ${deal.provision_chf.toLocaleString("de-CH")}`
        : null;

  return (
    <article
      draggable
      onDragStart={() => onDragStart?.(deal.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(deal)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick(deal);
              }
            }
          : undefined
      }
      className={cn(
        "cursor-grab rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)]",
        "transition-all duration-[var(--transition-fast)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)] active:cursor-grabbing"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[var(--color-ink)]">
            {deal.kunde_name ?? "Interessent"}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-[var(--color-ink-2)]">
            {objektTitle ?? deal.objekt_id}
          </p>
        </div>
        <span
          className={cn("mt-1 size-2.5 shrink-0 rounded-full", leadScoreColor(leadScore))}
          title={`Lead-Score ${leadScore}/10`}
        />
      </div>

      <div className="mt-3 space-y-1 text-[12px] text-[var(--color-ink-4)]">
        {deal.kunde_telefon ? <p>{deal.kunde_telefon}</p> : null}
        {lastContactLabel ? <p>Letzter Kontakt: {lastContactLabel}</p> : null}
        {deal.naechste_aktion ? (
          <p className="text-[var(--color-primary)]">
            → {deal.naechste_aktion}
          </p>
        ) : null}
        {provisionLabel ? (
          <p className="font-medium text-[var(--color-success)]">{provisionLabel}</p>
        ) : (
          <p className="text-[var(--color-ink-4)] italic">Provision erfassen…</p>
        )}
      </div>
    </article>
  );
}
