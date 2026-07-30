import type { DealWithRelations, ProvisionStatus } from "@/features/deals/types/deal-types";

export type RechnungStatus = "entwurf" | "gesendet" | "bezahlt" | "storniert";

export type RechnungRecord = {
  id: string;
  company_id: string;
  deal_id: string | null;
  nummer: string;
  empfaenger_name: string | null;
  empfaenger_email: string | null;
  betrag_netto: number | null;
  mwst_prozent: number | null;
  betrag_brutto: number | null;
  status: RechnungStatus;
  faellig_am: string | null;
  bezahlt_am: string | null;
  pdf_url: string | null;
  created_at: string;
};

export type ProvisionRow = DealWithRelations & {
  objekt_title: string | null;
  abschluss_datum: string | null;
};

export type FinanzenKpis = {
  verdientTotal: number;
  ausstehend: number;
  diesesJahr: number;
  diesenMonat: number;
  monatsziel: number;
  monatsFortschritt: number;
};

export type FinanzenOverview = {
  kpis: FinanzenKpis;
  provisions: ProvisionRow[];
};

export const PROVISION_STATUS_LABELS: Record<ProvisionStatus, string> = {
  ausstehend: "Ausstehend",
  verdient: "Verdient",
  rechnungsgestellt: "Rechnungsgestellt",
  bezahlt: "Bezahlt",
};

export const PROVISION_STATUS_STYLES: Record<ProvisionStatus, string> = {
  ausstehend: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  verdient: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  rechnungsgestellt: "border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]",
  bezahlt: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
};

export function formatChf(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatChfDetailed(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function computeProvisionKpis(
  provisions: ProvisionRow[],
  monatsziel: number
): FinanzenKpis {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let verdientTotal = 0;
  let ausstehend = 0;
  let diesesJahr = 0;
  let diesenMonat = 0;

  for (const row of provisions) {
    const amount = row.provision_chf ?? 0;
    if (amount <= 0) continue;

    const abschluss = row.abschluss_datum
      ? new Date(row.abschluss_datum)
      : row.phase >= 9
        ? new Date(row.phase_updated_at)
        : null;

    if (row.provision_status === "bezahlt") {
      verdientTotal += amount;
      if (abschluss && abschluss >= yearStart) diesesJahr += amount;
      if (abschluss && abschluss >= monthStart) diesenMonat += amount;
    } else if (
      row.provision_status === "verdient" ||
      row.provision_status === "rechnungsgestellt"
    ) {
      ausstehend += amount;
      if (row.provision_status === "verdient") {
        if (abschluss && abschluss >= yearStart) diesesJahr += amount;
        if (abschluss && abschluss >= monthStart) diesenMonat += amount;
      }
    }
  }

  const monatsFortschritt =
    monatsziel > 0 ? Math.min(100, (diesenMonat / monatsziel) * 100) : 0;

  return {
    verdientTotal,
    ausstehend,
    diesesJahr,
    diesenMonat,
    monatsziel,
    monatsFortschritt,
  };
}
