import type {
  CreateDealInput,
  DealActivityRecord,
  DealRecord,
  DealWithRelations,
  ProvisionStatus,
} from "@/features/deals/types/deal-types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const devDeals = new Map<string, DealWithRelations>();
const devActivities = new Map<string, DealActivityRecord[]>();

function generateDevId(prefix: string): string {
  return `dev-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function rowToDeal(row: Record<string, unknown>): DealRecord {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    objekt_id: String(row.objekt_id),
    kunde_id: row.kunde_id ? String(row.kunde_id) : null,
    vorgang_id: row.vorgang_id ? String(row.vorgang_id) : null,
    deal_type: row.deal_type === "vermietung" ? "vermietung" : "verkauf",
    phase: Number(row.phase) as DealRecord["phase"],
    phase_updated_at: String(row.phase_updated_at ?? new Date().toISOString()),
    provision_prozent:
      row.provision_prozent != null ? Number(row.provision_prozent) : null,
    provision_chf: row.provision_chf != null ? Number(row.provision_chf) : null,
    provision_mwst_prozent:
      row.provision_mwst_prozent != null
        ? Number(row.provision_mwst_prozent)
        : null,
    verkaufspreis_chf:
      row.verkaufspreis_chf != null ? Number(row.verkaufspreis_chf) : null,
    provision_rechnung_nr:
      typeof row.provision_rechnung_nr === "string"
        ? row.provision_rechnung_nr
        : null,
    provision_rechnung_url:
      typeof row.provision_rechnung_url === "string"
        ? row.provision_rechnung_url
        : null,
    provision_bezahlt_am:
      typeof row.provision_bezahlt_am === "string"
        ? row.provision_bezahlt_am
        : null,
    provision_status: (row.provision_status as ProvisionStatus) ?? "ausstehend",
    notizen: typeof row.notizen === "string" ? row.notizen : null,
    naechste_aktion:
      typeof row.naechste_aktion === "string" ? row.naechste_aktion : null,
    naechste_aktion_datum:
      typeof row.naechste_aktion_datum === "string"
        ? row.naechste_aktion_datum
        : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function enrichDeal(
  deal: DealRecord,
  kunde?: Record<string, unknown> | null
): DealWithRelations {
  const ansprechpartner =
    typeof kunde?.ansprechpartner === "string" ? kunde.ansprechpartner : null;
  const firmenname =
    typeof kunde?.firmenname === "string" ? kunde.firmenname : null;

  return {
    ...deal,
    kunde_name: ansprechpartner ?? firmenname ?? null,
    kunde_telefon: typeof kunde?.telefon === "string" ? kunde.telefon : null,
    kunde_email: typeof kunde?.email === "string" ? kunde.email : null,
  };
}

export async function listDealsForCompany(
  companyId: string,
  filters?: { objekt_id?: string; openOnly?: boolean }
): Promise<DealWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return [...devDeals.values()]
      .filter((deal) => deal.company_id === companyId)
      .filter((deal) =>
        filters?.objekt_id ? deal.objekt_id === filters.objekt_id : true
      )
      .filter((deal) => (filters?.openOnly ? deal.phase < 9 : true))
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }

  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("deals")
    .select("*, kunden: kunde_id ( ansprechpartner, firmenname, telefon, email )")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  if (filters?.objekt_id) {
    query = query.eq("objekt_id", filters.objekt_id);
  }
  if (filters?.openOnly) {
    query = query.lt("phase", 9);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[deals] list failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const deal = rowToDeal(row as Record<string, unknown>);
    const kunde = (row as { kunden?: Record<string, unknown> | null }).kunden;
    return enrichDeal(deal, kunde ?? null);
  });
}

export async function countOpenDeals(companyId: string): Promise<number> {
  const deals = await listDealsForCompany(companyId, { openOnly: true });
  return deals.length;
}

export async function createDealRecord(
  companyId: string,
  userId: string | null,
  input: CreateDealInput
): Promise<DealWithRelations | null> {
  const now = new Date().toISOString();
  const payload = {
    company_id: companyId,
    objekt_id: input.objekt_id,
    kunde_id: input.kunde_id ?? null,
    vorgang_id: input.vorgang_id ?? null,
    deal_type: input.deal_type ?? "verkauf",
    phase: input.phase ?? 1,
    phase_updated_at: now,
    provision_prozent: input.provision_prozent ?? null,
    provision_chf: input.provision_chf ?? null,
    provision_mwst_prozent: input.provision_mwst_prozent ?? null,
    verkaufspreis_chf: input.verkaufspreis_chf ?? null,
    provision_rechnung_nr: null,
    provision_rechnung_url: null,
    provision_bezahlt_am: null,
    provision_status: "ausstehend" as const,
    notizen: input.notizen ?? null,
    naechste_aktion: input.naechste_aktion ?? null,
    naechste_aktion_datum: input.naechste_aktion_datum ?? null,
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    const id = generateDevId("deal");
    const deal: DealWithRelations = {
      id,
      ...payload,
      created_at: now,
      kunde_name: null,
      kunde_telefon: null,
      kunde_email: null,
    };
    devDeals.set(id, deal);
    return deal;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("deals")
    .insert(payload as never)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[deals] create failed:", error?.message);
    return null;
  }

  const deal = enrichDeal(rowToDeal(data as Record<string, unknown>));

  await recordDealActivity({
    deal_id: deal.id,
    company_id: companyId,
    typ: "kontakt",
    von_phase: null,
    zu_phase: deal.phase,
    beschreibung: "Deal angelegt",
    erstellt_von: userId,
  });

  return deal;
}

export async function updateDealPhase(input: {
  dealId: string;
  companyId: string;
  userId: string | null;
  phase: number;
  typ?: "phase_wechsel" | "auto_erkannt";
  beschreibung?: string;
}): Promise<DealWithRelations | null> {
  const now = new Date().toISOString();
  const provisionStatus: ProvisionStatus =
    input.phase >= 9 ? "verdient" : "ausstehend";

  if (!isSupabaseConfigured()) {
    const existing = devDeals.get(input.dealId);
    if (!existing || existing.company_id !== input.companyId) return null;
    const vonPhase = existing.phase;
    const updated: DealWithRelations = {
      ...existing,
      phase: input.phase as DealWithRelations["phase"],
      phase_updated_at: now,
      updated_at: now,
      provision_status:
        input.phase >= 9 ? "verdient" : existing.provision_status,
    };
    devDeals.set(input.dealId, updated);
    await recordDealActivity({
      deal_id: input.dealId,
      company_id: input.companyId,
      typ: input.typ ?? "phase_wechsel",
      von_phase: vonPhase,
      zu_phase: input.phase,
      beschreibung: input.beschreibung ?? `Phase ${vonPhase} → ${input.phase}`,
      erstellt_von: input.userId,
    });
    return updated;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from("deals")
    .select("phase")
    .eq("id", input.dealId)
    .eq("company_id", input.companyId)
    .maybeSingle();

  const vonPhase = existing ? Number((existing as { phase: number }).phase) : null;

  const { data, error } = await supabase
    .from("deals")
    .update({
      phase: input.phase,
      phase_updated_at: now,
      updated_at: now,
      provision_status: provisionStatus,
    } as never)
    .eq("id", input.dealId)
    .eq("company_id", input.companyId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[deals] phase update failed:", error?.message);
    return null;
  }

  await recordDealActivity({
    deal_id: input.dealId,
    company_id: input.companyId,
    typ: input.typ ?? "phase_wechsel",
    von_phase: vonPhase,
    zu_phase: input.phase,
    beschreibung: input.beschreibung ?? `Phase ${vonPhase} → ${input.phase}`,
    erstellt_von: input.userId,
  });

  return enrichDeal(rowToDeal(data as Record<string, unknown>));
}

export async function recordDealActivity(input: {
  deal_id: string;
  company_id: string;
  typ: DealActivityRecord["typ"];
  von_phase?: number | null;
  zu_phase?: number | null;
  beschreibung?: string | null;
  erstellt_von?: string | null;
}): Promise<void> {
  const payload = {
    deal_id: input.deal_id,
    company_id: input.company_id,
    typ: input.typ,
    von_phase: input.von_phase ?? null,
    zu_phase: input.zu_phase ?? null,
    beschreibung: input.beschreibung ?? null,
    erstellt_von: input.erstellt_von ?? null,
  };

  if (!isSupabaseConfigured()) {
    const id = generateDevId("activity");
    const list = devActivities.get(input.deal_id) ?? [];
    list.unshift({
      id,
      ...payload,
      created_at: new Date().toISOString(),
    });
    devActivities.set(input.deal_id, list);
    return;
  }

  const supabase = await createClient();
  if (!supabase) return;

  await supabase.from("deal_aktivitaeten").insert(payload as never);
}

export async function findDealByVorgangId(
  companyId: string,
  vorgangId: string
): Promise<DealWithRelations | null> {
  const deals = await listDealsForCompany(companyId);
  return deals.find((deal) => deal.vorgang_id === vorgangId) ?? null;
}

export async function getDealById(
  companyId: string,
  dealId: string
): Promise<DealWithRelations | null> {
  const deals = await listDealsForCompany(companyId);
  return deals.find((deal) => deal.id === dealId) ?? null;
}

export async function updateDealProvision(input: {
  dealId: string;
  companyId: string;
  provision_prozent?: number | null;
  provision_chf?: number | null;
  provision_mwst_prozent?: number | null;
  verkaufspreis_chf?: number | null;
}): Promise<DealWithRelations | null> {
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  if (input.provision_prozent !== undefined) {
    updates.provision_prozent = input.provision_prozent;
  }
  if (input.provision_chf !== undefined) {
    updates.provision_chf = input.provision_chf;
  }
  if (input.provision_mwst_prozent !== undefined) {
    updates.provision_mwst_prozent = input.provision_mwst_prozent;
  }
  if (input.verkaufspreis_chf !== undefined) {
    updates.verkaufspreis_chf = input.verkaufspreis_chf;
  }

  if (!isSupabaseConfigured()) {
    const existing = devDeals.get(input.dealId);
    if (!existing || existing.company_id !== input.companyId) return null;
    const updated: DealWithRelations = {
      ...existing,
      ...updates,
      provision_prozent:
        input.provision_prozent !== undefined
          ? input.provision_prozent
          : existing.provision_prozent,
      provision_chf:
        input.provision_chf !== undefined
          ? input.provision_chf
          : existing.provision_chf,
      provision_mwst_prozent:
        input.provision_mwst_prozent !== undefined
          ? input.provision_mwst_prozent
          : existing.provision_mwst_prozent,
      verkaufspreis_chf:
        input.verkaufspreis_chf !== undefined
          ? input.verkaufspreis_chf
          : existing.verkaufspreis_chf,
      updated_at: now,
    };
    devDeals.set(input.dealId, updated);
    return updated;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("deals")
    .update(updates as never)
    .eq("id", input.dealId)
    .eq("company_id", input.companyId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[deals] provision update failed:", error?.message);
    return null;
  }

  return enrichDeal(rowToDeal(data as Record<string, unknown>));
}

export async function markDealProvisionPaid(input: {
  dealId: string;
  companyId: string;
}): Promise<DealWithRelations | null> {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const existing = devDeals.get(input.dealId);
    if (!existing || existing.company_id !== input.companyId) return null;
    const updated: DealWithRelations = {
      ...existing,
      provision_status: "bezahlt",
      provision_bezahlt_am: now,
      updated_at: now,
    };
    devDeals.set(input.dealId, updated);
    return updated;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("deals")
    .update({
      provision_status: "bezahlt",
      provision_bezahlt_am: now,
      updated_at: now,
    } as never)
    .eq("id", input.dealId)
    .eq("company_id", input.companyId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[deals] mark paid failed:", error?.message);
    return null;
  }

  return enrichDeal(rowToDeal(data as Record<string, unknown>));
}

export async function updateDealAfterInvoice(input: {
  dealId: string;
  companyId: string;
  rechnungNr: string;
  rechnungUrl?: string | null;
}): Promise<DealWithRelations | null> {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const existing = devDeals.get(input.dealId);
    if (!existing || existing.company_id !== input.companyId) return null;
    const updated: DealWithRelations = {
      ...existing,
      provision_status: "rechnungsgestellt",
      provision_rechnung_nr: input.rechnungNr,
      provision_rechnung_url: input.rechnungUrl ?? null,
      updated_at: now,
    };
    devDeals.set(input.dealId, updated);
    return updated;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("deals")
    .update({
      provision_status: "rechnungsgestellt",
      provision_rechnung_nr: input.rechnungNr,
      provision_rechnung_url: input.rechnungUrl ?? null,
      updated_at: now,
    } as never)
    .eq("id", input.dealId)
    .eq("company_id", input.companyId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[deals] invoice update failed:", error?.message);
    return null;
  }

  return enrichDeal(rowToDeal(data as Record<string, unknown>));
}
