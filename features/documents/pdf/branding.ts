import type { CompanyProfile } from "@/lib/company/company-profile-types";

/**
 * Unified branding snapshot for all professional PDF templates.
 * Derived from CompanyProfile — no separate persistence model.
 */
export type CompanyBranding = {
  companyName: string;
  logoUrl: string | null;
  logoInitials: string;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  iban: string;
  footer: string;
  paymentTerms: string;
  signature: string;
};

export function toCompanyBranding(profile: CompanyProfile): CompanyBranding {
  return {
    companyName: profile.companyName,
    logoUrl: profile.logoUrl,
    logoInitials: profile.logoInitials,
    primaryColor: profile.primaryColor,
    secondaryColor: profile.secondaryColor,
    address: profile.address,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    taxId: profile.taxId,
    iban: profile.iban,
    footer: profile.footer,
    paymentTerms: profile.paymentTerms,
    signature: profile.companySignature,
  };
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function lineItemTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}
