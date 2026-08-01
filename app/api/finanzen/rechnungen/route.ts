import { NextResponse } from "next/server";
import { upsertPreparedDocument } from "@/features/documents/services/document-engine";
import type { RechnungPayload } from "@/features/documents/pdf/types";
import {
  renderProfessionalPdf,
  suggestPdfFileName,
} from "@/features/documents/pdf/render-pdf";
import {
  getDealById,
  updateDealAfterInvoice,
} from "@/lib/deals/deal-repository";
import {
  createRechnungRecord,
  getNextRechnungNummer,
} from "@/lib/finanzen/rechnung-repository";
import { resolveCompanyProfileForServer } from "@/lib/company/company-profile-server";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateDe(date: Date): string {
  return date.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { dealId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  if (!body.dealId?.trim()) {
    return NextResponse.json({ error: "dealId erforderlich." }, { status: 400 });
  }

  const deal = await getDealById(context.companyId, body.dealId.trim());
  if (!deal) {
    return NextResponse.json({ error: "Deal nicht gefunden." }, { status: 404 });
  }

  if (!deal.provision_chf || deal.provision_chf <= 0) {
    return NextResponse.json(
      { error: "Keine Provision hinterlegt." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const profile = await resolveCompanyProfileForServer(
    supabase,
    context.companyId
  );
  const nummer = await getNextRechnungNummer(context.companyId);
  const issuedAt = new Date();
  const dueAt = addDays(issuedAt, 30);
  const mwst = deal.provision_mwst_prozent ?? 0;
  const netto = deal.provision_chf;
  const brutto = Math.round(netto * (1 + mwst / 100) * 100) / 100;

  const objectLabel = deal.objekt_id;
  const payload: RechnungPayload = {
    kind: "rechnung",
    invoiceNumber: nummer,
    issuedAt: formatDateDe(issuedAt),
    dueAt: formatDateDe(dueAt),
    customer: {
      name: deal.kunde_name ?? "Kunde",
      email: deal.kunde_email ?? undefined,
    },
    objectLabel,
    lineItems: [
      {
        id: "provision-1",
        quantity: 1,
        unit: "Pauschal",
        description: `Maklerprovision${deal.provision_prozent ? ` (${deal.provision_prozent} %)` : ""}${deal.verkaufspreis_chf ? ` — Verkaufspreis ${deal.verkaufspreis_chf.toLocaleString("de-CH")} CHF` : ""}`,
        unitPrice: netto,
      },
    ],
    vatRate: mwst,
    paymentTerms:
      "Zahlbar innert 30 Tagen ab Rechnungsdatum ohne Abzug.",
    closing: profile.companySignature,
  };

  const pdfBuffer = await renderProfessionalPdf({ profile, payload });
  const fileName = suggestPdfFileName(payload);
  const pdfBase64 = pdfBuffer.toString("base64");
  const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

  const rechnung = await createRechnungRecord({
    company_id: context.companyId,
    deal_id: deal.id,
    nummer,
    empfaenger_name: deal.kunde_name,
    empfaenger_email: deal.kunde_email,
    betrag_netto: netto,
    mwst_prozent: mwst,
    betrag_brutto: brutto,
    faellig_am: dueAt.toISOString(),
    pdf_url: pdfDataUrl,
  });

  if (!rechnung) {
    return NextResponse.json(
      { error: "Rechnung konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }

  const updatedDeal = await updateDealAfterInvoice({
    dealId: deal.id,
    companyId: context.companyId,
    rechnungNr: nummer,
    rechnungUrl: pdfDataUrl,
  });

  upsertPreparedDocument({
    id: `rechnung-${rechnung.id}`,
    typeId: "angebot",
    skill: profile.activePaidSkill,
    typeLabel: "Rechnung",
    title: `Rechnung ${nummer}`,
    customer: deal.kunde_name ?? "Kunde",
    objectId: deal.objekt_id,
    links: {
      objectId: deal.objekt_id,
      customerName: deal.kunde_name ?? undefined,
      customerEmail: deal.kunde_email ?? undefined,
    },
    status: "freigegeben",
    category: "fertig",
    lastEdited: new Date().toISOString(),
    helpyHint: "Provisionsrechnung aus Finanzen erstellt.",
    preparedByHelpy: true,
    previewSections: [
      {
        heading: "Rechnungsnummer",
        content: nummer,
      },
      {
        heading: "Betrag brutto",
        content: `${brutto.toLocaleString("de-CH")} CHF`,
      },
    ],
    pdfPayload: payload,
    attachmentMeta: {
      fileName,
      mimeType: "application/pdf",
      sourcePlatform: "helpy-finanzen",
      recognizedCategory: "Rechnung",
      recognizedStatus: "Von HELPY erkannt",
      dedupeKey: `finanzen-rechnung-${rechnung.id}`,
      sizeLabel: `${Math.round(pdfBuffer.length / 1024)} KB`,
    },
  });

  return NextResponse.json({
    rechnung,
    deal: updatedDeal,
    pdfBase64,
    fileName,
    payload,
  });
}
