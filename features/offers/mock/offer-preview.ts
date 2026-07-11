import type { Offer } from "@/features/offers/mock/mock-offers";
import { getCompanyProfile } from "@/lib/company/company-profile";

export type OfferDocumentContent = {
  intro: string;
  closing: string;
  paymentTerms: string;
  validUntil: string;
};

export const OFFER_PREVIEW_HELPY_MESSAGE =
  "Ich habe die PDF-Vorschau vorbereitet. Bitte prüfe noch Kundendaten, Preise und Zahlungsbedingungen.";

function defaultIntro(offer: Offer): string {
  return `Sehr geehrte/r ${offer.customer.contact},

vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot zu „${offer.title}“. Alle Positionen sind sorgfältig zusammengestellt und auf Ihren Bedarf abgestimmt.`;
}

function defaultClosing(offer: Offer): string {
  const { companyName } = getCompanyProfile();
  return `Bei Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung. Wir freuen uns auf Ihre Rückmeldung und eine mögliche Zusammenarbeit.

Mit freundlichen Grüßen
Ihr Team von ${companyName}`;
}

function defaultPaymentTerms(): string {
  return getCompanyProfile().paymentTerms;
}

function defaultValidUntil(offer: Offer): string {
  if (offer.deadline && offer.deadline !== "—") {
    return `Dieses Angebot ist gültig bis ${offer.deadline}.`;
  }
  return "Dieses Angebot ist 30 Tage ab Ausstellungsdatum gültig.";
}

export function getOfferDocument(offer: Offer): OfferDocumentContent {
  return {
    intro: offer.document?.intro ?? defaultIntro(offer),
    closing: offer.document?.closing ?? defaultClosing(offer),
    paymentTerms: offer.document?.paymentTerms ?? defaultPaymentTerms(),
    validUntil: offer.document?.validUntil ?? defaultValidUntil(offer),
  };
}
