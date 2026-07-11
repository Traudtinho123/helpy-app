import { NextResponse } from "next/server";
import {
  renderProfessionalPdf,
  suggestPdfFileName,
} from "@/features/documents/pdf/render-pdf";
import type { ProfessionalDocumentPayload } from "@/features/documents/pdf/types";
import { isPdfDocumentKind } from "@/features/documents/pdf/types";
import type { CompanyProfile } from "@/lib/company/company-profile-types";
import { MOCK_COMPANY_PROFILE } from "@/lib/company/company-profile-types";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";

export const runtime = "nodejs";

type PdfRequestBody = {
  payload?: ProfessionalDocumentPayload;
  branding?: Partial<CompanyProfile>;
  fileName?: string;
};

function resolveProfile(partial?: Partial<CompanyProfile>): CompanyProfile {
  return {
    ...MOCK_COMPANY_PROFILE,
    ...partial,
    companyId: partial?.companyId ?? MOCK_COMPANY_PROFILE.companyId,
  };
}

export async function POST(request: Request) {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  try {
    const body = (await request.json()) as PdfRequestBody;
    const payload = body.payload;

    if (!payload || !isPdfDocumentKind(payload.kind)) {
      return NextResponse.json(
        { error: "Ungültiger Dokumenttyp für PDF-Export." },
        { status: 400 }
      );
    }

    const profile = resolveProfile(body.branding);
    const pdfBuffer = await renderProfessionalPdf({ profile, payload });
    const fileName = body.fileName ?? suggestPdfFileName(payload);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[documents/pdf]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "PDF konnte nicht erzeugt werden.",
      },
      { status: 500 }
    );
  }
}
