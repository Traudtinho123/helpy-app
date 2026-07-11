"use client";

import { useEffect, useMemo } from "react";
import {
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyProfile } from "@/components/company/company-profile-context";
import { DocumentPdfActions } from "@/features/documents/components/document-pdf-actions";
import { OfferFooter } from "@/features/offers/components/preview/OfferFooter";
import { OfferHeader } from "@/features/offers/components/preview/OfferHeader";
import { OfferItemsTable } from "@/features/offers/components/preview/OfferItemsTable";
import { OfferSummary } from "@/features/offers/components/preview/OfferSummary";
import { getOfferDocument } from "@/features/offers/mock/offer-preview";
import type { Offer } from "@/features/offers/mock/mock-offers";
import { buildAngebotPayloadFromOffer } from "@/features/documents/pdf/payload-builders";

type OfferPreviewProps = {
  offer: Offer;
  className?: string;
};

export function OfferPreviewDocument({ offer }: OfferPreviewProps) {
  const { profile } = useCompanyProfile();
  const document = getOfferDocument(offer);

  return (
    <article className="mx-auto w-full max-w-[820px] bg-white px-10 py-12 shadow-[0_8px_40px_rgba(15,23,42,0.08)] sm:px-14 sm:py-14">
      <OfferHeader offer={offer} profile={profile} />

      <section className="mt-8">
        <p className="whitespace-pre-line text-[12px] leading-[1.85] text-[#334155]">
          {document.intro}
        </p>
      </section>

      <section className="mt-8">
        <OfferItemsTable offer={offer} />
      </section>

      <OfferSummary offer={offer} document={document} profile={profile} />
      <OfferFooter document={document} profile={profile} />
    </article>
  );
}

type OfferPreviewModalProps = {
  offer: Offer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OfferPreviewModal({
  offer,
  open,
  onOpenChange,
}: OfferPreviewModalProps) {
  const { profile } = useCompanyProfile();
  const pdfPayload = useMemo(
    () => (offer ? buildAngebotPayloadFromOffer(offer) : null),
    [offer]
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || !offer) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#0F172A]/40 backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#CBD5E1]/40 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            PDF-Vorschau · {offer.number}
          </p>
          <p className="mt-0.5 text-[12px] text-[#64748B]">
            {offer.customer.company} · {offer.title}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <DocumentPdfActions
              payload={pdfPayload}
              branding={profile}
              defaultRecipient={offer.customer.email}
              defaultSubject={`Angebot ${offer.number}: ${offer.title}`}
              compact
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 gap-2 rounded-[10px] border-[#CBD5E1]/60 text-[12px] font-medium"
          >
            <Pencil className="size-4" />
            Angebot bearbeiten
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            className="size-9 rounded-[10px] border-[#CBD5E1]/60"
            aria-label="Schließen"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <OfferPreviewDocument offer={offer} />
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-[#CBD5E1]/40 bg-white/95 px-5 py-4 backdrop-blur-xl sm:hidden">
        <DocumentPdfActions
          payload={pdfPayload}
          branding={profile}
          defaultRecipient={offer.customer.email}
          defaultSubject={`Angebot ${offer.number}: ${offer.title}`}
        />
      </div>
    </div>
  );
}
