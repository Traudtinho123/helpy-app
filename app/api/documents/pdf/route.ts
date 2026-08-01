import { NextResponse } from "next/server";
import {
  renderProfessionalPdf,
  suggestPdfFileName,
} from "@/features/documents/pdf/render-pdf";
import type { ProfessionalDocumentPayload } from "@/features/documents/pdf/types";
import { isPdfDocumentKind } from "@/features/documents/pdf/types";
import type { CompanyProfile } from "@/lib/company/company-profile-types";
import { resolveCompanyProfileForServer } from "@/lib/company/company-profile-server";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";
import { requireOAuthContext } from "@/lib/oauth/require-oauth-context";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type PdfRequestBody = {
  payload?: ProfessionalDocumentPayload;
  branding?: Partial<CompanyProfile>;
  fileName?: string;
};

function resolveProfile(
  base: CompanyProfile,
  partial?: Partial<CompanyProfile>
): CompanyProfile {
  return {
    ...base,
    ...partial,
    companyId: partial?.companyId ?? base.companyId,
  };
}

export async function POST(request: Request) {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  const auth = await requireOAuthContext();
  const supabase = await createClient();
  const baseProfile = await resolveCompanyProfileForServer(
    supabase,
    auth.ok ? auth.context.companyId : null
  );

  try {
    const body = (await request.json()) as PdfRequestBody;
    const payload = body.payload;

    if (!payload || !isPdfDocumentKind(payload.kind)) {
      return NextResponse.json(
        { error: "Ungültiger Dokumenttyp für PDF-Export." },
        { status: 400 }
      );
    }

    const profile = resolveProfile(baseProfile, body.branding);
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
