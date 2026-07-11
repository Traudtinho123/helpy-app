import { CompanyDocumentFooter } from "@/components/company/company-document-footer";
import type { CompanyProfile } from "@/lib/company/company-profile";
import type { OfferDocumentContent } from "@/features/offers/mock/offer-preview";

type OfferFooterProps = {
  document: OfferDocumentContent;
  profile: CompanyProfile;
};

export function OfferFooter({ document, profile }: OfferFooterProps) {
  return (
    <CompanyDocumentFooter
      profile={profile}
      closingText={document.closing}
    />
  );
}
