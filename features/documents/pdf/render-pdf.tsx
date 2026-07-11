import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { toCompanyBranding, type CompanyBranding } from "@/features/documents/pdf/branding";
import type { ProfessionalDocumentPayload } from "@/features/documents/pdf/types";
import { AngebotPdfDocument } from "@/features/documents/pdf/templates/angebot-pdf";
import { OffertePdfDocument } from "@/features/documents/pdf/templates/offerte-pdf";
import { ExposePdfDocument } from "@/features/documents/pdf/templates/expose-pdf";
import { BesichtigungsterminPdfDocument } from "@/features/documents/pdf/templates/besichtigungstermin-pdf";
import { DossierPdfDocument } from "@/features/documents/pdf/templates/dossier-pdf";
import type { CompanyProfile } from "@/lib/company/company-profile-types";

function buildPdfElement(
  branding: CompanyBranding,
  payload: ProfessionalDocumentPayload
): ReactElement<DocumentProps> {
  switch (payload.kind) {
    case "angebot":
      return createElement(AngebotPdfDocument, {
        branding,
        payload,
      }) as ReactElement<DocumentProps>;
    case "offerte":
      return createElement(OffertePdfDocument, {
        branding,
        payload,
      }) as ReactElement<DocumentProps>;
    case "expose":
      return createElement(ExposePdfDocument, {
        branding,
        payload,
      }) as ReactElement<DocumentProps>;
    case "besichtigungstermin":
      return createElement(BesichtigungsterminPdfDocument, {
        branding,
        payload,
      }) as ReactElement<DocumentProps>;
    case "dossier":
      return createElement(DossierPdfDocument, {
        branding,
        payload,
      }) as ReactElement<DocumentProps>;
    default: {
      const _exhaustive: never = payload;
      return _exhaustive;
    }
  }
}

export async function renderProfessionalPdf(input: {
  profile: CompanyProfile;
  payload: ProfessionalDocumentPayload;
}): Promise<Buffer> {
  const branding = toCompanyBranding(input.profile);
  const element = buildPdfElement(branding, input.payload);
  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}

export function suggestPdfFileName(payload: ProfessionalDocumentPayload): string {
  const safe = (value: string) =>
    value
      .replace(/[^\w\-äöüÄÖÜß]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

  switch (payload.kind) {
    case "angebot":
      return `${safe(payload.documentNumber)}.pdf`;
    case "offerte":
      return `${safe(payload.referenceNumber)}.pdf`;
    case "expose":
      return `Expose-${safe(payload.title)}.pdf`;
    case "besichtigungstermin":
      return `Besichtigung-${safe(payload.dateLabel)}.pdf`;
    case "dossier":
      return `Dossier-${safe(payload.title)}.pdf`;
  }
}
