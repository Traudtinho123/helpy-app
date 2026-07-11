"use client";

import { useCallback, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HelpyImproveOverlay } from "@/features/offers/components/helpy-offers-shared";
import { HelpyOffersPanel } from "@/features/offers/components/helpy-offers-panel";
import { OffersOverview } from "@/features/offers/components/offers-overview";
import { QuoteGenerator } from "@/features/offers/components/quote-generator";
import { OfferPreviewModal } from "@/features/offers/components/preview";
import {
  filterOffersByStatus,
  getOfferStatusCounts,
  mockOffers,
  type OfferStatus,
} from "@/features/offers/mock/mock-offers";

export function AngebotePage() {
  const [activeStatus, setActiveStatus] = useState<OfferStatus | "alle">("alle");
  const [selectedId, setSelectedId] = useState(mockOffers[0]?.id ?? "");
  const [isImproving, setIsImproving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const statusCounts = useMemo(() => getOfferStatusCounts(mockOffers), []);

  const filteredOffers = useMemo(
    () => filterOffersByStatus(mockOffers, activeStatus),
    [activeStatus]
  );

  const selectedOffer =
    mockOffers.find((o) => o.id === selectedId) ??
    filteredOffers[0] ??
    null;

  const handleStatusChange = (status: OfferStatus | "alle") => {
    setActiveStatus(status);
    const next = filterOffersByStatus(mockOffers, status);
    if (next.length > 0 && !next.some((o) => o.id === selectedId)) {
      setSelectedId(next[0].id);
    }
  };

  const handleImproveComplete = useCallback(() => {
    setIsImproving(false);
  }, []);

  const handleImproveWithHelpy = useCallback(() => {
    setIsImproving(true);
  }, []);

  const handleOpenPreview = useCallback(() => {
    setPreviewOpen(true);
  }, []);

  return (
    <>
      <HelpyImproveOverlay
        visible={isImproving}
        onComplete={handleImproveComplete}
      />

      <OfferPreviewModal
        offer={selectedOffer}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <DashboardShell
        activeHref="/angebote"
        rightPanel={
          <HelpyOffersPanel
            offer={selectedOffer}
            previewOpen={previewOpen}
            onOpenPreview={handleOpenPreview}
          />
        }
      >
        <div className="flex h-full min-h-0 overflow-hidden">
          <OffersOverview
            offers={filteredOffers}
            selectedId={selectedOffer?.id ?? ""}
            onSelect={setSelectedId}
            activeStatus={activeStatus}
            onStatusChange={handleStatusChange}
            statusCounts={statusCounts}
          />
          <QuoteGenerator
            offer={selectedOffer}
            onImproveWithHelpy={handleImproveWithHelpy}
            onOpenPreview={handleOpenPreview}
          />
        </div>
      </DashboardShell>
    </>
  );
}
