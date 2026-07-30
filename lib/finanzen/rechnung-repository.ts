import type {
  RechnungRecord,
  RechnungStatus,
} from "@/features/finanzen/types/finanzen-types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const devRechnungen = new Map<string, RechnungRecord[]>();

function generateDevId(): string {
  return `dev-rechnung-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function rowToRechnung(row: Record<string, unknown>): RechnungRecord {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    deal_id: row.deal_id ? String(row.deal_id) : null,
    nummer: String(row.nummer),
    empfaenger_name:
      typeof row.empfaenger_name === "string" ? row.empfaenger_name : null,
    empfaenger_email:
      typeof row.empfaenger_email === "string" ? row.empfaenger_email : null,
    betrag_netto:
      row.betrag_netto != null ? Number(row.betrag_netto) : null,
    mwst_prozent:
      row.mwst_prozent != null ? Number(row.mwst_prozent) : null,
    betrag_brutto:
      row.betrag_brutto != null ? Number(row.betrag_brutto) : null,
    status: (row.status as RechnungStatus) ?? "entwurf",
    faellig_am: typeof row.faellig_am === "string" ? row.faellig_am : null,
    bezahlt_am: typeof row.bezahlt_am === "string" ? row.bezahlt_am : null,
    pdf_url: typeof row.pdf_url === "string" ? row.pdf_url : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function listRechnungenForCompany(
  companyId: string
): Promise<RechnungRecord[]> {
  if (!isSupabaseConfigured()) {
    return [...(devRechnungen.get(companyId) ?? [])].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("rechnungen")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[rechnungen] list failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    rowToRechnung(row as Record<string, unknown>)
  );
}

export async function getNextRechnungNummer(
  companyId: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RE-${year}-`;

  const existing = await listRechnungenForCompany(companyId);
  const yearRechnungen = existing.filter((r) => r.nummer.startsWith(prefix));

  let maxSeq = 0;
  for (const rechnung of yearRechnungen) {
    const seqPart = rechnung.nummer.slice(prefix.length);
    const seq = parseInt(seqPart, 10);
    if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }

  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
}

export async function createRechnungRecord(input: {
  company_id: string;
  deal_id: string;
  nummer: string;
  empfaenger_name: string | null;
  empfaenger_email: string | null;
  betrag_netto: number;
  mwst_prozent: number;
  betrag_brutto: number;
  faellig_am: string;
  pdf_url?: string | null;
}): Promise<RechnungRecord | null> {
  const payload = {
    company_id: input.company_id,
    deal_id: input.deal_id,
    nummer: input.nummer,
    empfaenger_name: input.empfaenger_name,
    empfaenger_email: input.empfaenger_email,
    betrag_netto: input.betrag_netto,
    mwst_prozent: input.mwst_prozent,
    betrag_brutto: input.betrag_brutto,
    status: "entwurf" as const,
    faellig_am: input.faellig_am,
    pdf_url: input.pdf_url ?? null,
  };

  if (!isSupabaseConfigured()) {
    const id = generateDevId();
    const record: RechnungRecord = {
      id,
      ...payload,
      bezahlt_am: null,
      created_at: new Date().toISOString(),
    };
    const list = devRechnungen.get(input.company_id) ?? [];
    list.unshift(record);
    devRechnungen.set(input.company_id, list);
    return record;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("rechnungen")
    .insert(payload as never)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[rechnungen] create failed:", error?.message);
    return null;
  }

  return rowToRechnung(data as Record<string, unknown>);
}

export function provisionsToCsv(
  rows: Array<{
    objekt_title: string | null;
    objekt_id: string;
    kunde_name: string | null;
    abschluss_datum: string | null;
    verkaufspreis_chf: number | null;
    provision_prozent: number | null;
    provision_chf: number | null;
    provision_status: string;
    provision_rechnung_nr: string | null;
  }>
): string {
  const header = [
    "Objekt",
    "Kunde",
    "Abschluss",
    "Verkaufspreis CHF",
    "Provision %",
    "Provision CHF",
    "Status",
    "Rechnungsnr",
  ].join(";");

  const lines = rows.map((row) => {
    const abschluss = row.abschluss_datum
      ? new Date(row.abschluss_datum).toLocaleDateString("de-CH")
      : "";
    return [
      `"${(row.objekt_title ?? row.objekt_id).replace(/"/g, '""')}"`,
      `"${(row.kunde_name ?? "").replace(/"/g, '""')}"`,
      abschluss,
      row.verkaufspreis_chf?.toFixed(2) ?? "",
      row.provision_prozent?.toFixed(2) ?? "",
      row.provision_chf?.toFixed(2) ?? "",
      row.provision_status,
      row.provision_rechnung_nr ?? "",
    ].join(";");
  });

  return [header, ...lines].join("\n");
}
