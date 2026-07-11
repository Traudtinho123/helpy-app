import { CompanyDocumentHeader } from "@/components/company/company-document-header";
import type { CompanyProfile } from "@/lib/company/company-profile";
import type { Offer } from "@/features/offers/mock/mock-offers";

type OfferHeaderProps = {
  offer: Offer;
  profile: CompanyProfile;
};

export function OfferHeader({ offer, profile }: OfferHeaderProps) {
  return (
    <CompanyDocumentHeader
      profile={profile}
      documentTitle="Angebot"
      meta={[
        { label: "Angebotsnummer", value: offer.number },
        { label: "Datum", value: offer.createdAt },
        { label: "Betreff", value: offer.title },
      ]}
      customerBlock={{
        title: "Angebot für",
        rows: [
          { label: "Firma", value: offer.customer.company },
          { label: "Ansprechpartner", value: offer.customer.contact },
          { label: "E-Mail", value: offer.customer.email },
          { label: "Adresse", value: offer.customer.address },
        ],
      }}
    />
  );
}
