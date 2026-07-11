"use client";

import { FileText, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  calculateQuoteTotals,
  formatCurrency,
  offerStatusLabels,
  offerStatusStyles,
  type Offer,
  type OfferStatus,
} from "@/features/offers/mock/mock-offers";
import { cn } from "@/lib/utils";

const statusFilters: { id: OfferStatus | "alle"; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "entwurf", label: "Entwurf" },
  { id: "warten-auf-freigabe", label: "Warten auf Freigabe" },
  { id: "gesendet", label: "Gesendet" },
  { id: "angenommen", label: "Angenommen" },
  { id: "abgelehnt", label: "Abgelehnt" },
];

type OffersOverviewProps = {
  offers: Offer[];
  selectedId: string;
  onSelect: (id: string) => void;
  activeStatus: OfferStatus | "alle";
  onStatusChange: (status: OfferStatus | "alle") => void;
  statusCounts: Record<OfferStatus | "alle", number>;
};

export function OffersOverview({
  offers,
  selectedId,
  onSelect,
  activeStatus,
  onStatusChange,
  statusCounts,
}: OffersOverviewProps) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-[#CBD5E1]/50 bg-white/60 backdrop-blur-xl">
      <div className="border-b border-[#CBD5E1]/40 px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#0F172A]">
              Angebote
            </h2>
            <p className="text-[11px] font-medium text-[#64748B]">
              {offers.length} Angebote
            </p>
          </div>
          <Button
            size="icon-sm"
            variant="outline"
            className="size-8 rounded-[10px] border-[#CBD5E1]/60"
            aria-label="Neues Angebot"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto border-b border-[#CBD5E1]/30 px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {statusFilters.map(({ id, label }) => {
          const isActive = activeStatus === id;
          const count = statusCounts[id];

          return (
            <button
              key={id}
              type="button"
              onClick={() => onStatusChange(id)}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-300",
                isActive
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              )}
            >
              {label}
              {count > 0 && ` (${count})`}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {offers.length === 0 ? (
          <p className="px-2 py-8 text-center text-[12px] text-[#94A3B8]">
            Keine Angebote in diesem Status.
          </p>
        ) : (
          <div className="space-y-2">
            {offers.map((offer) => {
              const isSelected = offer.id === selectedId;
              const { total } = calculateQuoteTotals(
                offer.lineItems,
                offer.vatRate
              );

              return (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => onSelect(offer.id)}
                  className={cn(
                    "w-full rounded-[16px] border p-4 text-left transition-all duration-300",
                    isSelected
                      ? "border-[#2563EB]/30 bg-white shadow-[0_2px_16px_rgba(37,99,235,0.12)] ring-1 ring-[#2563EB]/15"
                      : "border-[#CBD5E1]/40 bg-white/80 hover:border-[#2563EB]/20 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EFF6FF]">
                      <FileText className="size-4 text-[#2563EB]" />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 shrink-0 rounded-full px-2 text-[9px] font-semibold",
                        offerStatusStyles[offer.status]
                      )}
                    >
                      {offerStatusLabels[offer.status]}
                    </Badge>
                  </div>
                  <p className="mt-3 text-[12px] font-semibold leading-snug text-[#0F172A]">
                    {offer.title}
                  </p>
                  <p className="mt-1 text-[11px] text-[#64748B]">
                    {offer.customer.company}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[#94A3B8]">
                      {offer.number}
                    </span>
                    <span className="text-[12px] font-bold text-[#2563EB]">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
