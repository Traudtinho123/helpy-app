import {
  calculateQuoteTotals,
  formatCurrency,
  type Offer,
} from "@/features/offers/mock/mock-offers";
import type { OfferDocumentContent } from "@/features/offers/mock/offer-preview";
import type { CompanyProfile } from "@/lib/company/company-profile";

type OfferSummaryProps = {
  offer: Offer;
  document: OfferDocumentContent;
  profile: CompanyProfile;
};

export function OfferSummary({ offer, document, profile }: OfferSummaryProps) {
  const { subtotal, vat, total } = calculateQuoteTotals(
    offer.lineItems,
    offer.vatRate
  );

  return (
    <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-md space-y-4 text-[12px] leading-relaxed text-[#475569]">
        <div>
          <p
            className="text-[10px] font-semibold tracking-[0.08em] uppercase"
            style={{ color: profile.primaryColor }}
          >
            Zahlungsbedingungen
          </p>
          <p className="mt-1.5">{document.paymentTerms}</p>
        </div>
        <div>
          <p
            className="text-[10px] font-semibold tracking-[0.08em] uppercase"
            style={{ color: profile.primaryColor }}
          >
            Gültigkeit
          </p>
          <p className="mt-1.5">{document.validUntil}</p>
        </div>
      </div>

      <div
        className="w-full max-w-xs shrink-0 rounded-[12px] border p-5"
        style={{
          borderColor: `${profile.primaryColor}25`,
          backgroundColor: `${profile.primaryColor}06`,
        }}
      >
        <div className="space-y-2.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-[#64748B]">Zwischensumme</span>
            <span className="font-medium text-[#0F172A]">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-[#64748B]">MwSt. ({offer.vatRate} %)</span>
            <span className="font-medium text-[#0F172A]">
              {formatCurrency(vat)}
            </span>
          </div>
          <div
            className="flex justify-between border-t pt-3"
            style={{ borderColor: `${profile.primaryColor}20` }}
          >
            <span className="text-[14px] font-semibold text-[#0F172A]">
              Gesamtsumme
            </span>
            <span
              className="text-[16px] font-bold"
              style={{ color: profile.primaryColor }}
            >
              {formatCurrency(total)}
            </span>
          </div>
        </div>
        <p className="mt-3 text-[10px] text-[#94A3B8]">
          Alle Preise in EUR, zzgl. gesetzlicher MwSt.
        </p>
      </div>
    </div>
  );
}
